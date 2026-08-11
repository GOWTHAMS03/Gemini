package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.WeeklyTripPlanDTOs.*;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyTripPlanService {

    private final WeeklyTripPlanRepository weeklyPlanRepository;
    private final DailyTripPlanRepository dailyTripPlanRepository;
    private final DailyTripShopRepository dailyTripShopRepository;
    private final DispatchGroupRepository dispatchGroupRepository;
    private final DeliveryRouteRepository deliveryRouteRepository;
    private final RouteShopRepository routeShopRepository;
    private final ShopRepository shopRepository;
    private final AppNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;

    // ═══════════════════════════════════════════════════════════════
    // WEEKLY PLAN CRUD
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public WeeklyPlanResponse createWeeklyPlan(WeeklyPlanCreateRequest request, String createdBy) {
        log.info("Creating weekly plan for dispatch group {} from {} to {}",
                request.getDispatchGroupId(), request.getWeekStartDate(), request.getWeekEndDate());

        if (request.getDispatchGroupId() == null || request.getDispatchGroupId() == 0) {
            throw new IllegalArgumentException("Dispatch Group ID is required");
        }
        if (request.getWeekStartDate() == null) {
            throw new IllegalArgumentException("Week Start Date is required");
        }

        // Auto-calculate end date if omitted (Mon to Sat = +5 days)
        LocalDate startDate = request.getWeekStartDate();
        LocalDate endDate = request.getWeekEndDate() != null ? request.getWeekEndDate() : startDate.plusDays(5);

        DispatchGroup group = dispatchGroupRepository.findById(request.getDispatchGroupId())
                .orElseThrow(() -> new IllegalArgumentException("Dispatch Group not found with ID: " + request.getDispatchGroupId()));

        // Check for overlapping active plans
        List<WeeklyTripPlan> overlapping = weeklyPlanRepository.findOverlappingPlans(group.getId(), startDate, endDate);
        if (!overlapping.isEmpty()) {
            WeeklyTripPlan existing = overlapping.get(0);
            throw new IllegalStateException("An active weekly plan (" + existing.getPlanNumber() + ") already exists for this dispatch group in the selected date range");
        }

        String planNumber = "WP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        WeeklyTripPlan plan = WeeklyTripPlan.builder()
                .planNumber(planNumber)
                .dispatchGroup(group)
                .weekStartDate(startDate)
                .weekEndDate(endDate)
                .weekNumber(startDate.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()))
                .year(startDate.getYear())
                .status(WeeklyPlanStatus.DRAFT)
                .notes(request.getNotes())
                .createdBy(createdBy)
                .dailyTrips(new ArrayList<>())
                .build();

        // Auto-generate daily trip slots for Mon-Sat in the range
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek() != DayOfWeek.SUNDAY) {
                DailyTripPlan dailyTrip = DailyTripPlan.builder()
                        .weeklyTripPlan(plan)
                        .tripDate(current)
                        .dayOfWeek(current.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase())
                        .status(DailyTripStatus.PLANNED)
                        .shops(new ArrayList<>())
                        .build();
                plan.getDailyTrips().add(dailyTrip);
            }
            current = current.plusDays(1);
        }

        WeeklyTripPlan saved = weeklyPlanRepository.save(plan);
        log.info("Weekly plan created: {} with {} daily trip slots", saved.getPlanNumber(), saved.getDailyTrips().size());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<WeeklyPlanResponse> getAllWeeklyPlans() {
        return weeklyPlanRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WeeklyPlanResponse getWeeklyPlan(Long planId) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));
        return mapToResponse(plan);
    }

    @Transactional
    public WeeklyPlanResponse updateWeeklyPlan(Long planId, WeeklyPlanCreateRequest request, String updatedBy) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));

        if (plan.getStatus() != WeeklyPlanStatus.DRAFT && plan.getStatus() != WeeklyPlanStatus.PLANNED) {
            throw new RuntimeException("Only DRAFT or PLANNED plans can be updated");
        }

        if (request.getNotes() != null) plan.setNotes(request.getNotes());
        plan.setUpdatedBy(updatedBy);

        return mapToResponse(weeklyPlanRepository.save(plan));
    }

    // ═══════════════════════════════════════════════════════════════
    // DAILY TRIP: ROUTE & SHOP ASSIGNMENT
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public DailyTripResponse assignRouteToDay(Long planId, String dayOfWeek, AssignRouteRequest request) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));

        if (plan.getStatus() != WeeklyPlanStatus.DRAFT && plan.getStatus() != WeeklyPlanStatus.PLANNED) {
            throw new RuntimeException("Cannot modify a published/completed/cancelled plan");
        }

        DailyTripPlan dailyTrip = dailyTripPlanRepository
                .findByWeeklyTripPlanIdAndDayOfWeek(planId, dayOfWeek.toUpperCase())
                .orElseThrow(() -> new RuntimeException("No daily trip found for " + dayOfWeek));

        // Look up route
        DeliveryRoute route = deliveryRouteRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found"));

        dailyTrip.setRouteId(route.getId());
        dailyTrip.setRouteName(route.getRouteName());
        dailyTrip.setTotalDistanceKm(route.getTotalDistanceKm() != null ? route.getTotalDistanceKm() : 0.0);
        dailyTrip.setEstimatedDuration(route.getEstimatedDuration());

        // Clear existing shops
        dailyTrip.getShops().clear();
        dailyTripPlanRepository.save(dailyTrip);

        // Get shops from the route or custom list
        List<Long> shopIds = request.getShopIds();
        if (shopIds == null || shopIds.isEmpty()) {
            // Use all shops from the route
            List<RouteShop> routeShops = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(route.getId());
            shopIds = routeShops.stream()
                    .filter(rs -> rs.getShop() != null)
                    .map(rs -> rs.getShop().getId())
                    .collect(Collectors.toList());
        }

        int seq = 1;
        for (Long shopId : shopIds) {
            Optional<Shop> shopOpt = shopRepository.findById(shopId);
            if (shopOpt.isPresent()) {
                Shop shop = shopOpt.get();
                DailyTripShop tripShop = DailyTripShop.builder()
                        .dailyTripPlan(dailyTrip)
                        .shop(shop)
                        .shopName(shop.getName())
                        .ownerName(shop.getOwnerName())
                        .phone(shop.getPhone())
                        .address(shop.getAddress())
                        .latitude(shop.getLatitude())
                        .longitude(shop.getLongitude())
                        .visitSequence(seq++)
                        .visitStatus(ShopVisitStatus.PENDING)
                        .expectedVisitTime(LocalTime.of(7 + (seq / 3), (seq % 3) * 20))
                        .build();
                dailyTrip.getShops().add(tripShop);
            }
        }

        dailyTrip.setTotalShops(dailyTrip.getShops().size());
        DailyTripPlan saved = dailyTripPlanRepository.save(dailyTrip);

        // Update weekly plan total
        updateWeeklyTotals(plan);

        log.info("Assigned route '{}' with {} shops to {} of plan {}",
                route.getRouteName(), saved.getTotalShops(), dayOfWeek, plan.getPlanNumber());
        return mapDailyTripResponse(saved);
    }

    @Transactional
    public DailyTripResponse updateShopsForDay(Long planId, String dayOfWeek, UpdateShopsRequest request) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));

        DailyTripPlan dailyTrip = dailyTripPlanRepository
                .findByWeeklyTripPlanIdAndDayOfWeek(planId, dayOfWeek.toUpperCase())
                .orElseThrow(() -> new RuntimeException("No daily trip found for " + dayOfWeek));

        // Clear and rebuild shops with custom sequence
        dailyTrip.getShops().clear();
        dailyTripPlanRepository.save(dailyTrip);

        for (ShopSequenceItem item : request.getShops()) {
            Optional<Shop> shopOpt = shopRepository.findById(item.getShopId());
            if (shopOpt.isPresent()) {
                Shop shop = shopOpt.get();
                LocalTime expTime = LocalTime.of(8, 0);
                if (item.getExpectedVisitTime() != null && !item.getExpectedVisitTime().isBlank()) {
                    try { expTime = LocalTime.parse(item.getExpectedVisitTime()); } catch (Exception ignored) {}
                }
                DailyTripShop tripShop = DailyTripShop.builder()
                        .dailyTripPlan(dailyTrip)
                        .shop(shop)
                        .shopName(shop.getName())
                        .ownerName(shop.getOwnerName())
                        .phone(shop.getPhone())
                        .address(shop.getAddress())
                        .latitude(shop.getLatitude())
                        .longitude(shop.getLongitude())
                        .visitSequence(item.getVisitSequence())
                        .visitStatus(ShopVisitStatus.PENDING)
                        .expectedVisitTime(expTime)
                        .build();
                dailyTrip.getShops().add(tripShop);
            }
        }

        dailyTrip.setTotalShops(dailyTrip.getShops().size());
        DailyTripPlan saved = dailyTripPlanRepository.save(dailyTrip);
        updateWeeklyTotals(plan);
        return mapDailyTripResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLISH / CANCEL
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public WeeklyPlanResponse publishWeeklyPlan(Long planId, String publishedBy) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));

        if (plan.getStatus() != WeeklyPlanStatus.DRAFT && plan.getStatus() != WeeklyPlanStatus.PLANNED) {
            throw new RuntimeException("Only DRAFT or PLANNED plans can be published");
        }

        // Validate at least one day has a route assigned
        boolean hasAnyRoute = plan.getDailyTrips().stream().anyMatch(d -> d.getRouteId() != null);
        if (!hasAnyRoute) {
            throw new RuntimeException("Cannot publish: at least one day must have a route assigned");
        }

        plan.setStatus(WeeklyPlanStatus.PUBLISHED);
        plan.setPublishedAt(ZonedDateTime.now());
        plan.setPublishedBy(publishedBy);
        WeeklyTripPlan saved = weeklyPlanRepository.save(plan);

        // Send notifications to all team members
        sendPublishNotifications(saved);

        log.info("Weekly plan {} published by {}", saved.getPlanNumber(), publishedBy);
        return mapToResponse(saved);
    }

    @Transactional
    public WeeklyPlanResponse cancelWeeklyPlan(Long planId, String cancelledBy) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));

        plan.setStatus(WeeklyPlanStatus.CANCELLED);
        plan.setUpdatedBy(cancelledBy);
        return mapToResponse(weeklyPlanRepository.save(plan));
    }

    @Transactional
    public void deleteWeeklyPlan(Long planId) {
        WeeklyTripPlan plan = weeklyPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Weekly plan not found"));
        weeklyPlanRepository.delete(plan);
        log.info("Weekly plan {} deleted", plan.getPlanNumber());
    }

    @Transactional
    public WeeklyPlanResponse duplicateWeeklyPlan(Long sourcePlanId, LocalDate targetWeekStartDate, String createdBy) {
        WeeklyTripPlan source = weeklyPlanRepository.findById(sourcePlanId)
                .orElseThrow(() -> new IllegalArgumentException("Source weekly plan not found"));

        if (targetWeekStartDate == null) {
            throw new IllegalArgumentException("Target week start date is required");
        }

        LocalDate targetWeekEndDate = targetWeekStartDate.plusDays(5); // Mon to Sat

        // Check for overlapping active plans for this group in target week
        List<WeeklyTripPlan> overlapping = weeklyPlanRepository.findOverlappingPlans(
                source.getDispatchGroup().getId(), targetWeekStartDate, targetWeekEndDate);
        if (!overlapping.isEmpty()) {
            throw new IllegalStateException("A plan already exists for dispatch group '" +
                    source.getDispatchGroup().getGroupName() + "' in week starting " + targetWeekStartDate);
        }

        String planNumber = "WP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        WeeklyTripPlan clone = WeeklyTripPlan.builder()
                .planNumber(planNumber)
                .dispatchGroup(source.getDispatchGroup())
                .weekStartDate(targetWeekStartDate)
                .weekEndDate(targetWeekEndDate)
                .weekNumber(targetWeekStartDate.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()))
                .year(targetWeekStartDate.getYear())
                .status(WeeklyPlanStatus.DRAFT)
                .notes("Repeated schedule cloned from " + source.getPlanNumber() + (source.getNotes() != null ? " | " + source.getNotes() : ""))
                .totalShops(source.getTotalShops())
                .totalDistanceKm(source.getTotalDistanceKm())
                .createdBy(createdBy)
                .dailyTrips(new ArrayList<>())
                .build();

        // Map dayOfWeek to target date offset (MONDAY = 0, TUESDAY = 1, etc.)
        Map<String, Integer> dayOffsetMap = Map.of(
                "MONDAY", 0, "TUESDAY", 1, "WEDNESDAY", 2,
                "THURSDAY", 3, "FRIDAY", 4, "SATURDAY", 5
        );

        for (DailyTripPlan sourceTrip : source.getDailyTrips()) {
            Integer offset = dayOffsetMap.get(sourceTrip.getDayOfWeek().toUpperCase());
            LocalDate tripDate = offset != null ? targetWeekStartDate.plusDays(offset) : targetWeekStartDate;

            DailyTripPlan cloneTrip = DailyTripPlan.builder()
                    .weeklyTripPlan(clone)
                    .tripDate(tripDate)
                    .dayOfWeek(sourceTrip.getDayOfWeek())
                    .routeId(sourceTrip.getRouteId())
                    .routeName(sourceTrip.getRouteName())
                    .status(DailyTripStatus.PLANNED)
                    .totalShops(sourceTrip.getTotalShops())
                    .totalDistanceKm(sourceTrip.getTotalDistanceKm())
                    .estimatedDuration(sourceTrip.getEstimatedDuration())
                    .notes(sourceTrip.getNotes())
                    .shops(new ArrayList<>())
                    .build();

            for (DailyTripShop sourceShop : sourceTrip.getShops()) {
                DailyTripShop cloneShop = DailyTripShop.builder()
                        .dailyTripPlan(cloneTrip)
                        .shop(sourceShop.getShop())
                        .shopName(sourceShop.getShopName())
                        .ownerName(sourceShop.getOwnerName())
                        .phone(sourceShop.getPhone())
                        .address(sourceShop.getAddress())
                        .latitude(sourceShop.getLatitude())
                        .longitude(sourceShop.getLongitude())
                        .visitSequence(sourceShop.getVisitSequence())
                        .visitStatus(ShopVisitStatus.PENDING)
                        .expectedVisitTime(sourceShop.getExpectedVisitTime())
                        .distanceFromPrevKm(sourceShop.getDistanceFromPrevKm())
                        .build();
                cloneTrip.getShops().add(cloneShop);
            }
            clone.getDailyTrips().add(cloneTrip);
        }

        WeeklyTripPlan saved = weeklyPlanRepository.save(clone);
        log.info("Weekly plan {} duplicated from {} to target week {}",
                saved.getPlanNumber(), source.getPlanNumber(), targetWeekStartDate);
        return mapToResponse(saved);
    }

    // ═══════════════════════════════════════════════════════════════
    // MOBILE: TODAY'S TRIP, WEEKLY SCHEDULE, SHOP VISIT UPDATES
    // ═══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public DailyTripResponse getTodaysTrip(Long userId) {
        LocalDate today = LocalDate.now();

        // 1. Try sales person (many-to-many) in WeeklyTripPlan
        List<DailyTripPlan> trips = dailyTripPlanRepository.findTodaysTripForSalesPerson(userId, today);
        if (trips.isEmpty()) {
            // 2. Try legacy single sales person
            trips = dailyTripPlanRepository.findTodaysTripForLegacySalesPerson(userId, today);
        }
        if (trips.isEmpty()) {
            // 3. Try driver
            trips = dailyTripPlanRepository.findTodaysTripForDriver(userId, today);
        }
        if (!trips.isEmpty()) {
            return mapDailyTripResponse(trips.get(0));
        }

        // 4. Fallback: Check live dispatched trips for user (Sales Executive or Driver)
        if (tripRepository != null) {
            List<Trip> activeTrips = tripRepository.findActiveTripsForUser(userId);
            if (!activeTrips.isEmpty()) {
                return mapLiveTripToDailyTripResponse(activeTrips.get(0));
            }
        }

        return null;
    }

    @Transactional(readOnly = true)
    public List<DailyTripResponse> getWeeklyTripsForUser(Long userId) {
        LocalDate today = LocalDate.now();
        // Find published plans active for this week
        List<WeeklyTripPlan> plans = weeklyPlanRepository.findByDateInRange(today);

        List<DailyTripResponse> result = new ArrayList<>();
        for (WeeklyTripPlan plan : plans) {
            DispatchGroup group = plan.getDispatchGroup();
            boolean isTeamMember = false;

            if (group != null) {
                if (group.getDriver() != null && group.getDriver().getId().equals(userId)) isTeamMember = true;
                if (!isTeamMember && group.getAllSalesPersons() != null && group.getAllSalesPersons().stream().anyMatch(sp -> sp.getId().equals(userId))) {
                    isTeamMember = true;
                }
            }

            if (isTeamMember && (plan.getStatus() == WeeklyPlanStatus.PUBLISHED || plan.getStatus() == WeeklyPlanStatus.IN_PROGRESS)) {
                List<DailyTripResponse> mapped = plan.getDailyTrips().stream()
                        .sorted(Comparator.comparing(DailyTripPlan::getTripDate))
                        .map(this::mapDailyTripResponse)
                        .collect(Collectors.toList());
                result.addAll(mapped);
            }
        }

        if (!result.isEmpty()) {
            return result;
        }

        // Fallback: Check live dispatched trips for user
        if (tripRepository != null) {
            List<Trip> activeTrips = tripRepository.findActiveTripsForUser(userId);
            for (Trip t : activeTrips) {
                result.add(mapLiveTripToDailyTripResponse(t));
            }
        }

        return result;
    }

    @Transactional
    public DailyShopResponse updateShopVisitStatus(Long tripShopId, UpdateShopVisitStatusRequest request) {
        DailyTripShop tripShop = dailyTripShopRepository.findById(tripShopId)
                .orElseThrow(() -> new RuntimeException("Trip shop not found"));

        if (request.getVisitStatus() != null) {
            tripShop.setVisitStatus(ShopVisitStatus.valueOf(request.getVisitStatus().toUpperCase()));
        }
        if ("IN_PROGRESS".equalsIgnoreCase(request.getVisitStatus()) && tripShop.getActualArrivalTime() == null) {
            tripShop.setActualArrivalTime(ZonedDateTime.now());
        }
        if ("VISITED".equalsIgnoreCase(request.getVisitStatus())) {
            tripShop.setActualDepartureTime(ZonedDateTime.now());
        }
        if (request.getNotes() != null) tripShop.setNotes(request.getNotes());
        if (request.getOrderAmount() != null) tripShop.setOrderAmount(BigDecimal.valueOf(request.getOrderAmount()));
        if (request.getPaymentCollected() != null) tripShop.setPaymentCollected(BigDecimal.valueOf(request.getPaymentCollected()));

        return mapDailyShopResponse(dailyTripShopRepository.save(tripShop));
    }

    @Transactional
    public DailyTripResponse startDailyTrip(Long dailyTripId) {
        DailyTripPlan trip = dailyTripPlanRepository.findById(dailyTripId)
                .orElseThrow(() -> new RuntimeException("Daily trip not found"));
        trip.setStatus(DailyTripStatus.IN_PROGRESS);
        trip.setStartTime(ZonedDateTime.now());
        return mapDailyTripResponse(dailyTripPlanRepository.save(trip));
    }

    @Transactional
    public DailyTripResponse completeDailyTrip(Long dailyTripId) {
        DailyTripPlan trip = dailyTripPlanRepository.findById(dailyTripId)
                .orElseThrow(() -> new RuntimeException("Daily trip not found"));
        trip.setStatus(DailyTripStatus.COMPLETED);
        trip.setCompletionTime(ZonedDateTime.now());
        return mapDailyTripResponse(dailyTripPlanRepository.save(trip));
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .notificationType(n.getNotificationType().name())
                        .referenceId(n.getReferenceId())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void markNotificationRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════════

    private void sendPublishNotifications(WeeklyTripPlan plan) {
        DispatchGroup group = plan.getDispatchGroup();
        String title = "📋 Weekly Trip Plan Published";
        String message = String.format(
                "Your weekly trip plan (%s to %s) has been published.\nGroup: %s\nTap to view your schedule.",
                plan.getWeekStartDate(), plan.getWeekEndDate(), group.getGroupName());

        Set<User> recipients = new HashSet<>();
        recipients.addAll(group.getAllSalesPersons());
        if (group.getDriver() != null) recipients.add(group.getDriver());

        for (User recipient : recipients) {
            AppNotification notification = AppNotification.builder()
                    .recipient(recipient)
                    .title(title)
                    .message(message)
                    .notificationType(NotificationType.WEEKLY_PLAN_PUBLISHED)
                    .referenceId(plan.getId())
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
        log.info("Sent publish notifications to {} team members for plan {}", recipients.size(), plan.getPlanNumber());
    }

    private void updateWeeklyTotals(WeeklyTripPlan plan) {
        int totalShops = plan.getDailyTrips().stream().mapToInt(d -> d.getTotalShops() != null ? d.getTotalShops() : 0).sum();
        double totalKm = plan.getDailyTrips().stream().mapToDouble(d -> d.getTotalDistanceKm() != null ? d.getTotalDistanceKm() : 0.0).sum();
        plan.setTotalShops(totalShops);
        plan.setTotalDistanceKm(totalKm);
        weeklyPlanRepository.save(plan);
    }

    // ─── Mappers ───────────────────────────────────────────────────

    private WeeklyPlanResponse mapToResponse(WeeklyTripPlan plan) {
        DispatchGroup group = plan.getDispatchGroup();

        List<MemberInfo> salesPersonInfos = group.getAllSalesPersons().stream()
                .map(sp -> MemberInfo.builder()
                        .id(sp.getId())
                        .fullName(sp.getFullName())
                        .phone(sp.getPhone())
                        .role("SALES_PERSON")
                        .build())
                .collect(Collectors.toList());

        MemberInfo driverInfo = group.getDriver() != null ?
                MemberInfo.builder()
                        .id(group.getDriver().getId())
                        .fullName(group.getDriver().getFullName())
                        .phone(group.getDriver().getPhone())
                        .role("DRIVER")
                        .build() : null;

        VehicleInfo vehicleInfo = group.getVehicle() != null ?
                VehicleInfo.builder()
                        .id(group.getVehicle().getId())
                        .registrationNumber(group.getVehicle().getVehicleNumber())
                        .vehicleType(group.getVehicle().getType())
                        .build() : null;

        List<DailyTripResponse> dailyResponses = plan.getDailyTrips().stream()
                .sorted(Comparator.comparing(DailyTripPlan::getTripDate))
                .map(this::mapDailyTripResponse)
                .collect(Collectors.toList());

        return WeeklyPlanResponse.builder()
                .id(plan.getId())
                .planNumber(plan.getPlanNumber())
                .dispatchGroupId(group.getId())
                .dispatchGroupName(group.getGroupName())
                .weekStartDate(plan.getWeekStartDate())
                .weekEndDate(plan.getWeekEndDate())
                .weekNumber(plan.getWeekNumber())
                .year(plan.getYear())
                .status(plan.getStatus().name())
                .totalShops(plan.getTotalShops())
                .totalDistanceKm(plan.getTotalDistanceKm())
                .notes(plan.getNotes())
                .publishedAt(plan.getPublishedAt() != null ? plan.getPublishedAt().toString() : null)
                .publishedBy(plan.getPublishedBy())
                .createdAt(plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : null)
                .salesPersons(salesPersonInfos)
                .driver(driverInfo)
                .vehicle(vehicleInfo)
                .dailyTrips(dailyResponses)
                .build();
    }

    private DailyTripResponse mapDailyTripResponse(DailyTripPlan dt) {
        List<DailyShopResponse> shopResponses = dt.getShops().stream()
                .sorted(Comparator.comparingInt(DailyTripShop::getVisitSequence))
                .map(this::mapDailyShopResponse)
                .collect(Collectors.toList());

        return DailyTripResponse.builder()
                .id(dt.getId())
                .tripDate(dt.getTripDate())
                .dayOfWeek(dt.getDayOfWeek())
                .routeId(dt.getRouteId())
                .routeName(dt.getRouteName())
                .status(dt.getStatus().name())
                .totalShops(dt.getTotalShops())
                .totalDistanceKm(dt.getTotalDistanceKm())
                .estimatedDuration(dt.getEstimatedDuration())
                .startTime(dt.getStartTime() != null ? dt.getStartTime().toString() : null)
                .completionTime(dt.getCompletionTime() != null ? dt.getCompletionTime().toString() : null)
                .notes(dt.getNotes())
                .shops(shopResponses)
                .build();
    }

    private DailyShopResponse mapDailyShopResponse(DailyTripShop s) {
        return DailyShopResponse.builder()
                .id(s.getId())
                .shopId(s.getShop() != null ? s.getShop().getId() : null)
                .shopName(s.getShopName())
                .ownerName(s.getOwnerName())
                .phone(s.getPhone())
                .address(s.getAddress())
                .latitude(s.getLatitude() != null ? s.getLatitude().doubleValue() : null)
                .longitude(s.getLongitude() != null ? s.getLongitude().doubleValue() : null)
                .visitSequence(s.getVisitSequence())
                .visitStatus(s.getVisitStatus().name())
                .expectedVisitTime(s.getExpectedVisitTime() != null ? s.getExpectedVisitTime().toString() : null)
                .actualArrivalTime(s.getActualArrivalTime() != null ? s.getActualArrivalTime().toString() : null)
                .actualDepartureTime(s.getActualDepartureTime() != null ? s.getActualDepartureTime().toString() : null)
                .notes(s.getNotes())
                .orderAmount(s.getOrderAmount() != null ? s.getOrderAmount().doubleValue() : 0.0)
                .paymentCollected(s.getPaymentCollected() != null ? s.getPaymentCollected().doubleValue() : 0.0)
                .distanceFromPrevKm(s.getDistanceFromPrevKm())
                .build();
    }

    private DailyTripResponse mapLiveTripToDailyTripResponse(Trip trip) {
        List<DailyShopResponse> shopResponses = new ArrayList<>();
        if (trip.getShopVisits() != null) {
            shopResponses = trip.getShopVisits().stream()
                    .sorted(Comparator.comparingInt(sv -> sv.getVisitSequence() != null ? sv.getVisitSequence() : 0))
                    .map(sv -> DailyShopResponse.builder()
                            .id(sv.getId())
                            .shopId(sv.getShop() != null ? sv.getShop().getId() : null)
                            .shopName(sv.getShop() != null ? sv.getShop().getName() : "")
                            .ownerName(sv.getShop() != null ? sv.getShop().getOwnerName() : "")
                            .phone(sv.getShop() != null ? sv.getShop().getPhone() : "")
                            .address(sv.getShop() != null ? sv.getShop().getAddress() : "")
                            .latitude(sv.getShop() != null && sv.getShop().getLatitude() != null ? sv.getShop().getLatitude().doubleValue() : null)
                            .longitude(sv.getShop() != null && sv.getShop().getLongitude() != null ? sv.getShop().getLongitude().doubleValue() : null)
                            .visitSequence(sv.getVisitSequence() != null ? sv.getVisitSequence() : 1)
                            .visitStatus(sv.getStatus() != null ? sv.getStatus().name() : "PENDING")
                            .expectedVisitTime(sv.getExpectedVisitTime() != null ? sv.getExpectedVisitTime().toString() : "08:00")
                            .actualArrivalTime(sv.getActualArrivalTime() != null ? sv.getActualArrivalTime().toString() : null)
                            .actualDepartureTime(sv.getActualDepartureTime() != null ? sv.getActualDepartureTime().toString() : null)
                            .notes(sv.getNotes())
                            .orderAmount(sv.getBillAmount() != null ? sv.getBillAmount() : 0.0)
                            .paymentCollected(sv.getCollectionAmount() != null ? sv.getCollectionAmount() : 0.0)
                            .build())
                    .collect(Collectors.toList());
        }

        return DailyTripResponse.builder()
                .id(trip.getId())
                .tripDate(trip.getTripDate())
                .dayOfWeek(trip.getTripDate() != null ? trip.getTripDate().getDayOfWeek().name() : "TODAY")
                .routeId(trip.getRouteGroup() != null ? trip.getRouteGroup().getId() : null)
                .routeName(trip.getRouteName() != null ? trip.getRouteName() : "Dispatched Route")
                .status(trip.getStatus() != null ? trip.getStatus().name() : "DISPATCHED")
                .totalShops(shopResponses.size())
                .shops(shopResponses)
                .build();
    }
}
