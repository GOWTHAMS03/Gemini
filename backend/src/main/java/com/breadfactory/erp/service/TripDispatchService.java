package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.*;
import com.breadfactory.erp.dto.RouteOptimizationDTOs.*;
import com.breadfactory.erp.dto.TripSettlementDTO.*;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripDispatchService {

    private final TripRepository tripRepository;
    private final DispatchGroupRepository dispatchGroupRepository;
    private final RouteGroupRepository routeGroupRepository;
    private final ShopRouteRepository shopRouteRepository;
    private final TripShopVisitRepository tripShopVisitRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final DamagedProductTrackingRepository damagedProductRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final FinishedGoodsInventoryRepository finishedGoodsInventoryRepository;
    private final ProductStockLedgerRepository stockLedgerRepository;
    private final WarehouseRepository warehouseRepository;
    private final ValidationService validationService;

    private final ExpenseRepository expenseRepository;
    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final AccountingAutomationService accountingService;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final InvoiceRepository invoiceRepository;
    private final DeliveryRouteRepository deliveryRouteRepository;
    private final JdbcTemplate jdbcTemplate;

    private static final double FACTORY_LAT = 10.787252191240228;
    private static final double FACTORY_LNG = 79.57505803846621;

    private double calculateRoadDistance(double lat1, double lon1, double lat2, double lon2) {
        if (Math.abs(lat1 - lat2) < 0.000001 && Math.abs(lon1 - lon2) < 0.000001) {
            return 0.0;
        }
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double straightKm = 6371.0 * c;
        return Math.round((straightKm * 1.26) * 100.0) / 100.0;
    }
    private final DeliveryRepository deliveryRepository;

    // ═════════════════════════════════════════════════════════════════
    // DISPATCH GROUP MANAGEMENT
    // ═════════════════════════════════════════════════════════════════

    @Transactional
    public DispatchGroupDTO createDispatchGroup(DispatchGroupCreateRequest request, String createdBy) {
        log.info("Creating dispatch group: {}", request.getGroupName());
        User salesPerson = null;
        if (request.getSalesPersonId() != null) {
            try {
                validationService.validateActiveUser(request.getSalesPersonId(), "Sales Person");
            } catch (Exception ignored) {}
            salesPerson = userRepository.findById(request.getSalesPersonId()).orElse(null);
        }
        User driver = null;
        if (request.getDriverId() != null) {
            try {
                validationService.validateActiveUser(request.getDriverId(), "Driver");
            } catch (Exception ignored) {}
            driver = userRepository.findById(request.getDriverId()).orElse(null);
        }
        Vehicle vehicle = null;
        if (request.getVehicleId() != null) {
            try {
                validationService.validateActiveVehicle(request.getVehicleId());
            } catch (Exception ignored) {}
            vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
        }

        DispatchGroup group = DispatchGroup.builder()
                .groupName(request.getGroupName())
                .description(request.getDescription())
                .salesPerson(salesPerson)
                .driver(driver)
                .vehicle(vehicle)
                .status(request.getStatus() != null ? request.getStatus() : DispatchGroupStatus.ACTIVE)
                .isActive(true)
                .createdBy(createdBy)
                .build();

        DispatchGroup saved = dispatchGroupRepository.save(group);
        log.info("Dispatch group created: ID {}", saved.getId());
        return mapToDispatchGroupDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<DispatchGroupDTO> getActiveDispatchGroups() {
        return dispatchGroupRepository.findByStatusAndIsActive(DispatchGroupStatus.ACTIVE, true)
                .stream()
                .map(this::mapToDispatchGroupDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DispatchGroupDTO getDispatchGroup(Long groupId) {
        DispatchGroup group = dispatchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Dispatch group not found"));
        return mapToDispatchGroupDTO(group);
    }

    @Transactional
    public DispatchGroupDTO updateDispatchGroup(Long id, DispatchGroupCreateRequest request) {
        log.info("Updating dispatch group: ID {}", id);
        DispatchGroup group = dispatchGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispatch group not found with ID: " + id));

        if (request.getGroupName() != null && !request.getGroupName().isBlank()) {
            group.setGroupName(request.getGroupName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getSalesPersonId() != null) {
            User salesPerson = userRepository.findById(request.getSalesPersonId())
                    .orElseThrow(() -> new RuntimeException("Sales person not found"));
            group.setSalesPerson(salesPerson);
        }
        if (request.getDriverId() != null) {
            User driver = userRepository.findById(request.getDriverId())
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            group.setDriver(driver);
        }
        if (request.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            group.setVehicle(vehicle);
        }
        if (request.getStatus() != null) {
            group.setStatus(request.getStatus());
        }

        DispatchGroup updated = dispatchGroupRepository.save(group);
        return mapToDispatchGroupDTO(updated);
    }

    @Transactional
    public void deleteDispatchGroup(Long id) {
        log.info("Deleting dispatch group: ID {}", id);
        if (dispatchGroupRepository.existsById(id)) {
            try {
                jdbcTemplate.update("DELETE FROM dispatch_group_sales_persons WHERE dispatch_group_id = ?", id);
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.update("UPDATE trips SET dispatch_group_id = NULL WHERE dispatch_group_id = ?", id);
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.update("UPDATE weekly_trip_plans SET dispatch_group_id = NULL WHERE dispatch_group_id = ?", id);
            } catch (Exception ignored) {}
            dispatchGroupRepository.deleteById(id);
        }
    }

    @Transactional(readOnly = true)
    public DispatchGroupDetailResponse getDispatchGroupDetails(Long groupId) {
        DispatchGroup group = dispatchGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Dispatch group not found with ID: " + groupId));

        // Fetch latest salaries for driver & sales person
        BigDecimal driverSalary = BigDecimal.ZERO;
        if (group.getDriver() != null) {
            driverSalary = employeeSalaryRepository
                    .findByEmployeeIdOrderBySalaryMonthDesc(group.getDriver().getId())
                    .stream().findFirst().map(EmployeeSalary::getNetSalary).orElse(BigDecimal.valueOf(25000));
        }

        BigDecimal salesPersonSalary = BigDecimal.ZERO;
        if (group.getSalesPerson() != null) {
            salesPersonSalary = employeeSalaryRepository
                    .findByEmployeeIdOrderBySalaryMonthDesc(group.getSalesPerson().getId())
                    .stream().findFirst().map(EmployeeSalary::getNetSalary).orElse(BigDecimal.valueOf(22000));
        }

        // Trip history for this group
        List<Trip> groupTrips = tripRepository.findByDispatchGroupIdOrderByTripDateDesc(groupId);
        List<GroupTripHistoryItem> history = groupTrips.stream().map(t -> GroupTripHistoryItem.builder()
                .tripId(t.getId())
                .tripNumber(t.getTripNumber())
                .tripDate(t.getTripDate())
                .routeName(t.getRouteName())
                .salesAmount(t.getTotalSalesAmount() != null ? t.getTotalSalesAmount() : BigDecimal.ZERO)
                .betaAmount(t.getBetaAmount() != null ? t.getBetaAmount() : BigDecimal.ZERO)
                .betaStatus(t.getBetaPaymentStatus())
                .tripStatus(t.getStatus())
                .settlementStatus(t.getSettlementStatus())
                .build()).collect(Collectors.toList());

        // Current active trip if any
        TripFinancialSummaryResponse currentTripSummary = null;
        Optional<Trip> activeTripOpt = groupTrips.stream()
                .filter(t -> t.getStatus() == TripStatus.DISPATCHED || t.getStatus() == TripStatus.IN_PROGRESS
                        || t.getStatus() == TripStatus.CONFIRMED)
                .findFirst();
        if (activeTripOpt.isPresent()) {
            currentTripSummary = getTripFinancialSummary(activeTripOpt.get().getId());
        }

        return DispatchGroupDetailResponse.builder()
                .groupId(group.getId())
                .groupName(group.getGroupName())
                .description(group.getDescription())
                .vehicleNumber(group.getVehicle() != null ? group.getVehicle().getVehicleNumber() : "N/A")
                .vehicleModel(group.getVehicle() != null ? group.getVehicle().getModel() : "N/A")
                .driverId(group.getDriver() != null ? group.getDriver().getId() : null)
                .driverName(group.getDriver() != null ? group.getDriver().getFullName() : "N/A")
                .driverPhone(group.getDriver() != null ? group.getDriver().getPhone() : "N/A")
                .driverMonthlySalary(driverSalary)
                .salesPersonId(group.getSalesPerson() != null ? group.getSalesPerson().getId() : null)
                .salesPersonName(group.getSalesPerson() != null ? group.getSalesPerson().getFullName() : "N/A")
                .salesPersonPhone(group.getSalesPerson() != null ? group.getSalesPerson().getPhone() : "N/A")
                .salesPersonMonthlySalary(salesPersonSalary)
                .tripHistory(history)
                .currentTrip(currentTripSummary)
                .build();
    }

    // ═════════════════════════════════════════════════════════════════
    // ROUTE GROUP MANAGEMENT
    // ═════════════════════════════════════════════════════════════════

    @Transactional
    public RouteGroupDTO createRouteGroup(RouteGroupCreateRequest request, String createdBy) {
        log.info("Creating route group: {}", request.getRouteName());
        RouteGroup group = RouteGroup.builder()
                .routeName(request.getRouteName())
                .description(request.getDescription())
                .areaRegion(request.getAreaRegion())
                .isActive(request.getIsActive())
                .createdBy(createdBy)
                .shopRoutes(new ArrayList<>())
                .build();

        RouteGroup saved = routeGroupRepository.save(group);
        return mapToRouteGroupDTO(saved);
    }

    @Transactional
    public RouteGroupDTO addShopToRoute(Long routeGroupId, ShopRouteCreateRequest request, String createdBy) {
        log.info("Adding shop {} to route {}", request.getShopId(), routeGroupId);

        RouteGroup route = routeGroupRepository.findById(routeGroupId)
                .orElseThrow(() -> new RuntimeException("Route group not found"));
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Shop not found"));

        if (!shop.getIsActive()) {
            throw new RuntimeException("Cannot add inactive shop to route");
        }

        if (shopRouteRepository.existsByRouteGroupIdAndShopIdAndVisitDay(routeGroupId, request.getShopId(),
                request.getVisitDay())) {
            throw new RuntimeException("Shop is already assigned to this route on this day");
        }

        ShopRoute shopRoute = ShopRoute.builder()
                .routeGroup(route)
                .shop(shop)
                .visitDay(request.getVisitDay())
                .visitSequence(request.getVisitSequence())
                .expectedVisitTime(request.getExpectedVisitTime())
                .isActive(request.getIsActive())
                .build();

        route.getShopRoutes().add(shopRoute);
        RouteGroup updated = routeGroupRepository.save(route);
        return mapToRouteGroupDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<RouteGroupDTO> getActiveRoutes() {
        return routeGroupRepository.findByIsActive(true)
                .stream()
                .map(this::mapToRouteGroupDTO)
                .collect(Collectors.toList());
    }

    // ═════════════════════════════════════════════════════════════════
    // TRIP MANAGEMENT & BETA EXPENSES
    // ═════════════════════════════════════════════════════════════════

    @Transactional
    public TripDTO createTrip(TripCreateRequest request, String createdBy) {
        log.info("Creating trip for dispatch group {} on date {}", request.getDispatchGroupId(), request.getTripDate());

        // Fail-safe DispatchGroup resolution
        DispatchGroup dispatchGroup = null;
        if (request.getDispatchGroupId() != null) {
            dispatchGroup = dispatchGroupRepository.findById(request.getDispatchGroupId()).orElse(null);
        }
        if (dispatchGroup == null) {
            dispatchGroup = dispatchGroupRepository.findAll().stream().findFirst().orElse(null);
        }
        if (dispatchGroup == null) {
            dispatchGroup = createDefaultDispatchGroup();
        }

        // Support both RouteGroup entity and DeliveryRoute entity
        String routeName = request.getRouteName();
        RouteGroup routeGroup = null;
        if (request.getRouteGroupId() != null) {
            Optional<RouteGroup> rgOpt = routeGroupRepository.findById(request.getRouteGroupId());
            if (rgOpt.isPresent()) {
                routeGroup = rgOpt.get();
                routeName = routeGroup.getRouteName();
            } else if (deliveryRouteRepository != null) {
                Optional<DeliveryRoute> drOpt = deliveryRouteRepository.findById(request.getRouteGroupId());
                if (drOpt.isPresent()) {
                    routeName = drOpt.get().getRouteName();
                }
            }
        }
        if (routeName == null || routeName.isBlank()) {
            routeName = "Standard Delivery Route";
        }

        // Safely resolve driver (driver_id cannot be null in DB)
        User driver = dispatchGroup.getDriver();
        if (driver == null && request.getDriverId() != null) {
            driver = userRepository.findById(request.getDriverId()).orElse(null);
        }
        if (driver == null) {
            driver = userRepository.findAll().stream()
                    .filter(u -> u.getRoles() != null && u.getRoles().stream()
                            .anyMatch(r -> r.getName() != null && r.getName().name().contains("DRIVER")))
                    .findFirst()
                    .orElse(null);
        }
        if (driver == null) {
            driver = userRepository.findAll().stream().findFirst().orElse(null);
        }

        // Safely resolve vehicle (vehicle_id cannot be null in DB)
        Vehicle vehicle = dispatchGroup.getVehicle();
        if (vehicle == null && request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
        }
        if (vehicle == null) {
            vehicle = vehicleRepository.findAll().stream().findFirst().orElse(null);
        }

        // Safely resolve sales person
        User salesPerson = dispatchGroup.getSalesPerson();
        if (salesPerson == null && dispatchGroup.getSalesPersons() != null
                && !dispatchGroup.getSalesPersons().isEmpty()) {
            salesPerson = dispatchGroup.getSalesPersons().get(0);
        }
        if (salesPerson == null) {
            salesPerson = driver;
        }

        // Soft validation for driver & vehicle
        if (driver != null) {
            try {
                validationService.validateNoActiveTrip(driver.getId(), "Driver");
            } catch (Exception e) {
                log.warn("Validation notice for Driver: {}", e.getMessage());
            }
        }
        if (vehicle != null) {
            try {
                validationService.validateNoActiveVehicleTrip(vehicle.getId());
            } catch (Exception e) {
                log.warn("Validation notice for Vehicle: {}", e.getMessage());
            }
        }

        String tripNumber = generateTripNumber();
        BigDecimal beta = request.getBetaAmount() != null ? request.getBetaAmount() : BigDecimal.ZERO;

        Trip trip = Trip.builder()
                .tripNumber(tripNumber)
                .tripDate(request.getTripDate() != null ? request.getTripDate() : LocalDate.now())
                .dispatchGroup(dispatchGroup)
                .salesPerson(salesPerson)
                .driver(driver)
                .vehicle(vehicle)
                .routeGroup(routeGroup)
                .routeName(routeName)
                .status(TripStatus.DISPATCHED)
                .betaAmount(beta)
                .betaPaymentStatus(PaymentStatus.PENDING)
                .betaNotes(request.getNotes())
                .otherTripExpenses(BigDecimal.ZERO)
                .totalSalesAmount(BigDecimal.ZERO)
                .cashCollected(BigDecimal.ZERO)
                .upiCollected(BigDecimal.ZERO)
                .totalCollected(BigDecimal.ZERO)
                .collectionVariance(BigDecimal.ZERO)
                .inventoryVariance(0)
                .settlementStatus(SettlementStatus.PENDING)
                .eodCompleted(false)
                .createdBy(createdBy)
                .items(new ArrayList<>())
                .shopVisits(new ArrayList<>())
                .totalLoadedQuantity(0)
                .isReconciled(false)
                .build();

        // 1. Populate custom arranged shops from Step 3 if provided
        if (request.getShops() != null && !request.getShops().isEmpty()) {
            for (TripCreateRequest.TripShopVisitRequest sReq : request.getShops()) {
                if (sReq.getShopId() == null)
                    continue;
                Optional<Shop> shopOpt = shopRepository.findById(sReq.getShopId());
                if (shopOpt.isPresent()) {
                    java.time.LocalTime expTime = parseVisitLocalTime(sReq.getExpectedVisitTime());

                    TripShopVisit visit = TripShopVisit.builder()
                            .trip(trip)
                            .shop(shopOpt.get())
                            .visitSequence(sReq.getVisitSequence() != null ? sReq.getVisitSequence()
                                    : trip.getShopVisits().size() + 1)
                            .status(ShopVisitStatus.SCHEDULED)
                            .expectedVisitTime(expTime)
                            .productsQty(0)
                            .billAmount(0.0)
                            .collectionAmount(0.0)
                            .build();
                    trip.getShopVisits().add(visit);
                }
            }
        } else if (routeGroup != null) {
            // Fallback: Add shops scheduled for this trip date
            Integer dayOfWeek = getDayOfWeek(request.getTripDate());
            List<ShopRoute> scheduledShops = shopRouteRepository.findScheduledShopsForDay(
                    request.getRouteGroupId(), dayOfWeek);

            for (ShopRoute shopRoute : scheduledShops) {
                TripShopVisit visit = TripShopVisit.builder()
                        .trip(trip)
                        .shop(shopRoute.getShop())
                        .visitSequence(shopRoute.getVisitSequence())
                        .status(ShopVisitStatus.SCHEDULED)
                        .expectedVisitTime(shopRoute.getExpectedVisitTime())
                        .productsQty(0)
                        .billAmount(0.0)
                        .collectionAmount(0.0)
                        .build();
                trip.getShopVisits().add(visit);
            }
        }

        // Add products to load & deduct from Central Finished Goods Inventory
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            Warehouse factoryWh = warehouseRepository.findByType(WarehouseType.FACTORY).stream().findFirst().orElse(null);

            for (TripCreateRequest.TripItemRequest itemReq : request.getItems()) {
                if (itemReq.getProductId() == null)
                    continue;
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Product not found with ID: " + itemReq.getProductId()));

                Integer availableStock = getAvailableWarehouseStock(product.getId());
                Integer loadedQty = itemReq.getLoadedQuantity() != null ? itemReq.getLoadedQuantity() : 0;
                if (loadedQty > availableStock) {
                    log.warn("Warehouse stock warning for product {}: requested {}, available {}",
                            product.getName(), loadedQty, availableStock);
                }

                // Deduct from Finished Goods Inventory (FIFO by expiry date)
                if (loadedQty > 0) {
                    List<FinishedGoodsInventory> fgBatches = finishedGoodsInventoryRepository.findAll().stream()
                            .filter(fg -> fg.getProduct() != null && fg.getProduct().getId().equals(product.getId()) &&
                                          fg.getQuantityAvailable() != null && fg.getQuantityAvailable() > 0)
                            .sorted(Comparator.comparing(FinishedGoodsInventory::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder())))
                            .collect(Collectors.toList());

                    int remainingToDeduct = loadedQty;
                    for (FinishedGoodsInventory batch : fgBatches) {
                        if (remainingToDeduct <= 0) break;
                        int avail = batch.getQuantityAvailable() != null ? batch.getQuantityAvailable() : 0;
                        if (avail >= remainingToDeduct) {
                            batch.setQuantityAvailable(avail - remainingToDeduct);
                            finishedGoodsInventoryRepository.save(batch);
                            remainingToDeduct = 0;
                        } else {
                            batch.setQuantityAvailable(0);
                            finishedGoodsInventoryRepository.save(batch);
                            remainingToDeduct -= avail;
                        }
                    }

                    // Record Product Stock Ledger entry (TRIP_LOAD)
                    try {
                        ProductStockLedger ledger = ProductStockLedger.builder()
                                .product(product)
                                .warehouse(factoryWh)
                                .trip(trip)
                                .movementType(StockMovementType.TRIP_LOAD)
                                .quantity(loadedQty)
                                .referenceNumber(trip.getTripNumber())
                                .notes("Loaded " + loadedQty + " units to truck " + (vehicle != null ? vehicle.getVehicleNumber() : "Fleet") + " for Trip " + trip.getTripNumber())
                                .build();
                        stockLedgerRepository.save(ledger);
                    } catch (Exception e) {
                        log.warn("Could not log stock ledger entry for trip load: {}", e.getMessage());
                    }
                }

                TripItem item = TripItem.builder()
                        .trip(trip)
                        .product(product)
                        .loadedQuantity(loadedQty)
                        .availableQuantity(loadedQty)
                        .soldQuantity(0)
                        .returnedQuantity(0)
                        .damagedQuantity(0)
                        .isReconciled(false)
                        .build();

                trip.getItems().add(item);
                trip.setTotalLoadedQuantity(trip.getTotalLoadedQuantity() + loadedQty);
            }
        }

        Trip saved = tripRepository.save(trip);

        // Auto-create Delivery records for each assigned shop in the trip
        for (TripShopVisit visit : saved.getShopVisits()) {
            Shop shop = visit.getShop();
            if (shop != null) {
                String delNumber = "DEL-" + saved.getTripNumber() + "-"
                        + String.format("%03d", visit.getVisitSequence());
                if (deliveryRepository.findByDeliveryNumber(delNumber).isEmpty()) {
                    Delivery delivery = Delivery.builder()
                            .deliveryNumber(delNumber)
                            .trip(saved)
                            .shop(shop)
                            .driver(saved.getDriver() != null ? saved.getDriver() : saved.getSalesPerson())
                            .status(DeliveryStatus.PENDING)
                            .build();
                    deliveryRepository.save(delivery);
                }
            }
        }

        log.info("Trip created successfully: {} (ID: {}, Status: DRAFT, {} stops, {} items)",
                saved.getTripNumber(), saved.getId(), saved.getShopVisits().size(), saved.getItems().size());
        return mapToTripDTO(saved);
    }

    private java.time.LocalTime parseVisitLocalTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            return java.time.LocalTime.of(8, 0);
        }
        String clean = timeStr.trim().toUpperCase();
        try {
            if (clean.contains("AM") || clean.contains("PM")) {
                java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("h:mm a",
                        Locale.ENGLISH);
                return java.time.LocalTime.parse(clean, fmt);
            }
            if (clean.length() == 4 && clean.contains(":")) {
                clean = "0" + clean;
            }
            if (clean.length() == 5 || clean.length() == 8) {
                return java.time.LocalTime.parse(clean);
            }
        } catch (Exception e) {
            log.warn("Could not parse visit time '{}', defaulting to 08:00: {}", timeStr, e.getMessage());
        }
        return java.time.LocalTime.of(8, 0);
    }

    @Transactional
    public TripDTO dispatchTrip(Long tripId, String dispatchedBy) {
        log.info("Dispatching trip: {}", tripId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getStatus().equals(TripStatus.CONFIRMED) && !trip.getStatus().equals(TripStatus.DRAFT)) {
            throw new RuntimeException("Only DRAFT or CONFIRMED trips can be dispatched");
        }

        for (TripItem item : trip.getItems()) {
            InventoryTransaction transaction = InventoryTransaction.builder()
                    .transactionType(InventoryTransactionType.WAREHOUSE_TO_TRIP)
                    .product(item.getProduct())
                    .quantity(item.getLoadedQuantity())
                    .source("WAREHOUSE")
                    .destination("TRIP_" + trip.getTripNumber())
                    .trip(trip)
                    .vehicle(trip.getVehicle())
                    .referenceNumber(trip.getTripNumber())
                    .createdBy(dispatchedBy)
                    .build();
            inventoryTransactionRepository.save(transaction);
        }

        // Ensure Delivery records exist for all shops upon dispatch
        for (TripShopVisit visit : trip.getShopVisits()) {
            Shop shop = visit.getShop();
            if (shop != null) {
                String delNumber = "DEL-" + trip.getTripNumber() + "-"
                        + String.format("%03d", visit.getVisitSequence());
                if (deliveryRepository.findByDeliveryNumber(delNumber).isEmpty()) {
                    Delivery delivery = Delivery.builder()
                            .deliveryNumber(delNumber)
                            .trip(trip)
                            .shop(shop)
                            .driver(trip.getDriver() != null ? trip.getDriver() : trip.getSalesPerson())
                            .status(DeliveryStatus.PENDING)
                            .build();
                    deliveryRepository.save(delivery);
                }
            }
        }

        trip.setStatus(TripStatus.DISPATCHED);
        trip.setDispatchTime(ZonedDateTime.now());
        trip.setUpdatedBy(dispatchedBy);
        Trip updated = tripRepository.save(trip);
        return mapToTripDTO(updated);
    }

    @Transactional
    public TripDTO startTrip(Long tripId, String startedBy) {
        log.info("Starting trip: ID {} by {}", tripId, startedBy);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        trip.setStatus(TripStatus.IN_PROGRESS);
        if (trip.getStartTime() == null) {
            trip.setStartTime(ZonedDateTime.now());
        }
        if (trip.getDispatchTime() == null) {
            trip.setDispatchTime(ZonedDateTime.now());
        }
        trip.setUpdatedBy(startedBy != null ? startedBy : "sales_person");

        Trip updated = tripRepository.save(trip);
        log.info("Trip #{} started at {}", updated.getTripNumber(), updated.getStartTime());
        return mapToTripDTO(updated);
    }

    @Transactional
    public TripDTO completeTrip(Long tripId, String completedBy) {
        log.info("Completing trip: ID {} by {}", tripId, completedBy);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        performInventoryReconciliation(trip);
        trip.setStatus(TripStatus.COMPLETED);
        trip.setCompletionTime(ZonedDateTime.now());
        trip.setReturnTime(ZonedDateTime.now());
        if (trip.getStartTime() == null) {
            trip.setStartTime(trip.getDispatchTime() != null ? trip.getDispatchTime() : ZonedDateTime.now());
        }
        trip.setUpdatedBy(completedBy != null ? completedBy : "sales_person");

        Trip updated = tripRepository.save(trip);
        log.info("Trip #{} completed at {}", updated.getTripNumber(), updated.getCompletionTime());
        return mapToTripDTO(updated);
    }

    @Transactional(readOnly = true)
    public Optional<Trip> getActiveTripForDriver(Long userId) {
        List<Trip> activeTrips = tripRepository.findByDriverIdAndStatus(userId, TripStatus.DISPATCHED);
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findBySalesPersonIdAndStatus(userId, TripStatus.DISPATCHED);
        }
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findByDriverIdAndStatus(userId, TripStatus.IN_PROGRESS);
        }
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findBySalesPersonIdAndStatus(userId, TripStatus.IN_PROGRESS);
        }
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findByDriverIdAndStatus(userId, TripStatus.DRAFT);
        }
        if (activeTrips.isEmpty()) {
            activeTrips = tripRepository.findBySalesPersonIdAndStatus(userId, TripStatus.DRAFT);
        }
        return activeTrips.stream().findFirst();
    }

    /**
     * Get active trip DTO for a user (driver or sales person).
     * Performs the entity-to-DTO mapping inside the transactional boundary
     * to avoid LazyInitializationException on shopVisits/items.
     */
    @Transactional(readOnly = true)
    public TripDTO getActiveTripDTOForUser(Long userId) {
        return getActiveTripForDriver(userId)
                .map(this::mapToTripDTO)
                .orElse(null);
    }

    @Transactional
    public Trip updateTripStatus(Long id, TripStatus status) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + id));
        trip.setStatus(status);
        if (status == TripStatus.IN_PROGRESS && trip.getStartTime() == null) {
            trip.setStartTime(ZonedDateTime.now());
        }
        if (status == TripStatus.COMPLETED) {
            trip.setReturnTime(ZonedDateTime.now());
            trip.setCompletionTime(ZonedDateTime.now());
            if (trip.getStartTime() == null) {
                trip.setStartTime(trip.getDispatchTime() != null ? trip.getDispatchTime() : ZonedDateTime.now());
            }
            performInventoryReconciliation(trip);
        }
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip createAndDispatchTrip(TripCreateRequest request) {
        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        String tripNumber = "TRIP-" + System.currentTimeMillis();
        BigDecimal beta = request.getBetaAmount() != null ? request.getBetaAmount() : BigDecimal.ZERO;

        Trip trip = Trip.builder()
                .tripNumber(tripNumber)
                .tripDate(LocalDate.now())
                .driver(driver)
                .vehicle(vehicle)
                .routeName(request.getRouteName() != null ? request.getRouteName() : "General Delivery")
                .status(TripStatus.DISPATCHED)
                .dispatchTime(ZonedDateTime.now())
                .betaAmount(beta)
                .betaPaymentStatus(PaymentStatus.PENDING)
                .betaNotes(request.getNotes())
                .otherTripExpenses(BigDecimal.ZERO)
                .totalSalesAmount(BigDecimal.ZERO)
                .cashCollected(BigDecimal.ZERO)
                .upiCollected(BigDecimal.ZERO)
                .totalCollected(BigDecimal.ZERO)
                .collectionVariance(BigDecimal.ZERO)
                .inventoryVariance(0)
                .settlementStatus(SettlementStatus.PENDING)
                .eodCompleted(false)
                .items(new ArrayList<>())
                .shopVisits(new ArrayList<>())
                .totalLoadedQuantity(0)
                .isReconciled(false)
                .build();

        if (request.getItems() != null) {
            for (TripCreateRequest.TripItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                TripItem item = TripItem.builder()
                        .trip(trip)
                        .product(product)
                        .loadedQuantity(itemReq.getLoadedQuantity())
                        .availableQuantity(itemReq.getLoadedQuantity())
                        .soldQuantity(0)
                        .returnedQuantity(0)
                        .damagedQuantity(0)
                        .isReconciled(false)
                        .build();

                trip.getItems().add(item);
                trip.setTotalLoadedQuantity(trip.getTotalLoadedQuantity() + itemReq.getLoadedQuantity());
            }
        }

        return tripRepository.save(trip);
    }

    // ═════════════════════════════════════════════════════════════════
    // TRIP BETA & EXPENSE INTEGRATION
    // ═════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public TripBetaResponse getTripBeta(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        return TripBetaResponse.builder()
                .tripId(trip.getId())
                .tripNumber(trip.getTripNumber())
                .dispatchGroupId(trip.getDispatchGroup() != null ? trip.getDispatchGroup().getId() : null)
                .dispatchGroupName(trip.getDispatchGroup() != null ? trip.getDispatchGroup().getGroupName() : "N/A")
                .driverId(trip.getDriver().getId())
                .driverName(trip.getDriver().getFullName())
                .salesPersonId(trip.getSalesPerson() != null ? trip.getSalesPerson().getId() : null)
                .salesPersonName(trip.getSalesPerson() != null ? trip.getSalesPerson().getFullName() : "N/A")
                .vehicleNumber(trip.getVehicle().getVehicleNumber())
                .betaAmount(trip.getBetaAmount() != null ? trip.getBetaAmount() : BigDecimal.ZERO)
                .betaPaymentStatus(trip.getBetaPaymentStatus())
                .betaPaymentMode(trip.getBetaPaymentMode())
                .betaPaidDate(trip.getBetaPaidDate())
                .betaExpenseId(trip.getBetaExpense() != null ? trip.getBetaExpense().getId() : null)
                .betaExpenseNumber(trip.getBetaExpense() != null ? trip.getBetaExpense().getExpenseNumber() : null)
                .notes(trip.getBetaNotes())
                .build();
    }

    @Transactional
    public TripBetaResponse configureTripBeta(Long tripId, BetaConfigRequest request) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        if (trip.getBetaPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Cannot modify already PAID beta for trip " + trip.getTripNumber());
        }

        trip.setBetaAmount(request.getBetaAmount() != null ? request.getBetaAmount() : BigDecimal.ZERO);
        if (request.getNotes() != null) {
            trip.setBetaNotes(request.getNotes());
        }

        Trip saved = tripRepository.save(trip);
        log.info("Configured beta for trip {}: ₹{}", saved.getTripNumber(), saved.getBetaAmount());
        return getTripBeta(saved.getId());
    }

    @Transactional
    public TripBetaResponse payTripBeta(Long tripId, BetaPaymentRequest request, String currentUser) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        if (trip.getBetaPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Trip beta is already PAID for trip " + trip.getTripNumber());
        }

        BigDecimal amount = request.getAmount() != null ? request.getAmount() : trip.getBetaAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Beta amount must be greater than zero to process payment");
        }

        PaymentMode mode = request.getPaymentMode() != null ? request.getPaymentMode() : PaymentMode.CASH;
        String payee = trip.getDriver().getFullName()
                + (trip.getSalesPerson() != null ? " & " + trip.getSalesPerson().getFullName() : "");

        // 1. Create Company Expense for Trip Beta
        String expenseNum = "EXP-BETA-" + trip.getTripNumber();
        Expense expense = Expense.builder()
                .expenseNumber(expenseNum)
                .category(ExpenseCategory.TRIP_BETA)
                .subtotal(amount)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(amount)
                .paymentMode(mode)
                .payeeName(payee)
                .expenseDate(LocalDate.now())
                .referenceNumber(
                        request.getReferenceNumber() != null ? request.getReferenceNumber() : trip.getTripNumber())
                .description("Trip Beta / Allowance for Trip " + trip.getTripNumber() + " (" + trip.getRouteName()
                        + ") | Driver: " + trip.getDriver().getFullName())
                .approvedBy(userRepository.findByUsername(currentUser).orElse(null))
                .build();
        Expense savedExpense = expenseRepository.save(expense);

        // 2. Record Cash/Bank Outflow in Treasury
        CashBankType accType = (mode == PaymentMode.CASH) ? CashBankType.CASH : CashBankType.BANK;
        BigDecimal lastCash = cashBankTransactionRepository
                .findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.CASH)
                .map(CashBankTransaction::getRunningCashBalance).orElse(BigDecimal.ZERO);
        BigDecimal lastBank = cashBankTransactionRepository
                .findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.BANK)
                .map(CashBankTransaction::getRunningBankBalance).orElse(BigDecimal.ZERO);

        BigDecimal newCash = (accType == CashBankType.CASH) ? lastCash.subtract(amount) : lastCash;
        BigDecimal newBank = (accType == CashBankType.BANK) ? lastBank.subtract(amount) : lastBank;

        CashBankTransaction txn = CashBankTransaction.builder()
                .transactionNumber("TXN-" + System.currentTimeMillis())
                .accountType(accType)
                .transactionType(accType == CashBankType.CASH ? CashTransactionType.CASH_OUT
                        : CashTransactionType.BANK_WITHDRAWAL)
                .amount(amount)
                .referenceType("TRIP_BETA_EXPENSE")
                .referenceNumber(expenseNum)
                .runningCashBalance(newCash)
                .runningBankBalance(newBank)
                .reconciliationStatus("RECONCILED")
                .notes("Disbursed Trip Beta for Trip " + trip.getTripNumber() + " to " + payee)
                .build();
        cashBankTransactionRepository.save(txn);

        // 3. Post Dual-Sided Journal Entry into General Ledger
        String creditAcc = (accType == CashBankType.CASH) ? "1000" : "1100";
        accountingService.recordJournalEntry(
                "TRIP_BETA", expenseNum,
                "Trip Beta Allowance for " + trip.getTripNumber() + " (" + trip.getRouteName() + ")",
                "5250", amount, // Debit 5250 (Trip Beta Expense)
                creditAcc, amount // Credit 1000/1100 (Cash / Bank)
        );

        // 4. Update Trip Record
        trip.setBetaAmount(amount);
        trip.setBetaPaymentStatus(PaymentStatus.PAID);
        trip.setBetaPaymentMode(mode);
        trip.setBetaPaidDate(ZonedDateTime.now());
        trip.setBetaExpense(savedExpense);
        if (request.getNotes() != null) {
            trip.setBetaNotes((trip.getBetaNotes() != null ? trip.getBetaNotes() + " | " : "") + request.getNotes());
        }

        Trip updated = tripRepository.save(trip);
        log.info("Trip Beta PAID for {}: ₹{} via {}", updated.getTripNumber(), amount, mode);
        return getTripBeta(updated.getId());
    }

    // ═════════════════════════════════════════════════════════════════
    // LIVE TRUCK INVENTORY & FINANCIAL SUMMARY
    // ═════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public TripLiveInventoryResponse getTripLiveInventory(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        int totalLoaded = 0;
        int totalSold = 0;
        int totalReturned = 0;
        int totalDamaged = 0;
        int totalRemaining = 0;

        List<LiveTruckInventoryItem> items = new ArrayList<>();

        for (TripItem ti : trip.getItems()) {
            int loaded = ti.getLoadedQuantity() != null ? ti.getLoadedQuantity() : 0;
            int sold = ti.getSoldQuantity() != null ? ti.getSoldQuantity() : 0;
            int returned = ti.getReturnedQuantity() != null ? ti.getReturnedQuantity() : 0;
            int damaged = ti.getDamagedQuantity() != null ? ti.getDamagedQuantity() : 0;
            int remaining = Math.max(0, loaded - sold - returned - damaged);

            totalLoaded += loaded;
            totalSold += sold;
            totalReturned += returned;
            totalDamaged += damaged;
            totalRemaining += remaining;

            items.add(LiveTruckInventoryItem.builder()
                    .productId(ti.getProduct().getId())
                    .productCode(ti.getProduct().getProductCode())
                    .productName(ti.getProduct().getName())
                    .mrp(ti.getProduct().getMrp())
                    .unitPrice(ti.getProduct().getDealerPrice() != null ? ti.getProduct().getDealerPrice()
                            : ti.getProduct().getRetailPrice())
                    .loadedQuantity(loaded)
                    .soldQuantity(sold)
                    .returnedQuantity(returned)
                    .damagedQuantity(damaged)
                    .remainingQuantity(remaining)
                    .totalSaleAmount(ti.getTotalSaleAmount() != null ? ti.getTotalSaleAmount() : BigDecimal.ZERO)
                    .build());
        }

        return TripLiveInventoryResponse.builder()
                .tripId(trip.getId())
                .tripNumber(trip.getTripNumber())
                .tripDate(trip.getTripDate())
                .routeName(trip.getRouteName())
                .driverName(trip.getDriver().getFullName())
                .salesPersonName(trip.getSalesPerson() != null ? trip.getSalesPerson().getFullName() : "N/A")
                .vehicleNumber(trip.getVehicle().getVehicleNumber())
                .totalLoadedQuantity(totalLoaded)
                .totalSoldQuantity(totalSold)
                .totalReturnedQuantity(totalReturned)
                .totalDamagedQuantity(totalDamaged)
                .totalRemainingQuantity(totalRemaining)
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public TripFinancialSummaryResponse getTripFinancialSummary(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        List<Invoice> invoices = invoiceRepository.findByTripId(tripId);

        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal upiSales = BigDecimal.ZERO;
        BigDecimal creditSales = BigDecimal.ZERO;
        BigDecimal totalSales = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            totalSales = totalSales.add(amt);
            if (inv.getPaymentMode() == PaymentMode.CASH) {
                cashSales = cashSales.add(amt);
            } else if (inv.getPaymentMode() == PaymentMode.UPI) {
                upiSales = upiSales.add(amt);
            } else if (inv.getPaymentMode() == PaymentMode.CREDIT) {
                creditSales = creditSales.add(amt);
            }
        }

        // Product Reconciliations
        List<ProductReconciliationItem> reconItems = new ArrayList<>();
        int totalLoaded = 0;
        int totalSold = 0;
        int totalReturned = 0;
        int totalDamaged = 0;
        int totalRemaining = 0;

        for (TripItem ti : trip.getItems()) {
            int loaded = ti.getLoadedQuantity() != null ? ti.getLoadedQuantity() : 0;
            int sold = ti.getSoldQuantity() != null ? ti.getSoldQuantity() : 0;
            int returned = ti.getReturnedQuantity() != null ? ti.getReturnedQuantity() : 0;
            int damaged = ti.getDamagedQuantity() != null ? ti.getDamagedQuantity() : 0;
            int expectedRemaining = Math.max(0, loaded - sold - returned);
            int actualRemaining = ti.getRemainingQuantity() != null ? ti.getRemainingQuantity() : expectedRemaining;
            int variance = actualRemaining - expectedRemaining;

            totalLoaded += loaded;
            totalSold += sold;
            totalReturned += returned;
            totalDamaged += damaged;
            totalRemaining += actualRemaining;

            reconItems.add(ProductReconciliationItem.builder()
                    .productId(ti.getProduct().getId())
                    .productName(ti.getProduct().getName())
                    .loadedQuantity(loaded)
                    .soldQuantity(sold)
                    .returnedQuantity(returned)
                    .expectedRemainingQuantity(expectedRemaining)
                    .actualRemainingQuantity(actualRemaining)
                    .variance(variance)
                    .status(variance == 0 ? "MATCHED" : "VARIANCE")
                    .build());
        }

        BigDecimal cashCollected = trip.getCashCollected() != null ? trip.getCashCollected() : cashSales;
        BigDecimal upiCollected = trip.getUpiCollected() != null ? trip.getUpiCollected() : upiSales;
        BigDecimal totalCollected = cashCollected.add(upiCollected);
        BigDecimal expectedImmediateCollection = cashSales.add(upiSales);
        BigDecimal collectionVariance = totalCollected.subtract(expectedImmediateCollection);

        BigDecimal beta = trip.getBetaAmount() != null ? trip.getBetaAmount() : BigDecimal.ZERO;
        BigDecimal otherExp = trip.getOtherTripExpenses() != null ? trip.getOtherTripExpenses() : BigDecimal.ZERO;
        BigDecimal totalTripExpense = beta.add(otherExp);

        return TripFinancialSummaryResponse.builder()
                .tripId(trip.getId())
                .tripNumber(trip.getTripNumber())
                .tripDate(trip.getTripDate())
                .routeName(trip.getRouteName())
                .status(trip.getStatus())
                .dispatchGroupId(trip.getDispatchGroup() != null ? trip.getDispatchGroup().getId() : null)
                .dispatchGroupName(trip.getDispatchGroup() != null ? trip.getDispatchGroup().getGroupName() : "N/A")
                .driverId(trip.getDriver().getId())
                .driverName(trip.getDriver().getFullName())
                .salesPersonId(trip.getSalesPerson() != null ? trip.getSalesPerson().getId() : null)
                .salesPersonName(trip.getSalesPerson() != null ? trip.getSalesPerson().getFullName() : "N/A")
                .vehicleNumber(trip.getVehicle().getVehicleNumber())
                .totalLoaded(totalLoaded)
                .totalSold(totalSold)
                .totalReturned(totalReturned)
                .totalDamaged(totalDamaged)
                .totalRemaining(totalRemaining)
                .productReconciliations(reconItems)
                .totalInvoices(invoices.size())
                .totalSalesAmount(totalSales)
                .cashSalesAmount(cashSales)
                .upiSalesAmount(upiSales)
                .creditSalesAmount(creditSales)
                .cashCollected(cashCollected)
                .upiCollected(upiCollected)
                .totalCollected(totalCollected)
                .collectionVariance(collectionVariance)
                .betaAmount(beta)
                .betaPaymentStatus(trip.getBetaPaymentStatus())
                .otherTripExpenses(otherExp)
                .totalTripExpense(totalTripExpense)
                .settlementStatus(trip.getSettlementStatus())
                .eodCompleted(trip.getEodCompleted())
                .eodSubmittedAt(trip.getEodSubmittedAt())
                .eodNotes(trip.getEodNotes())
                .settledBy(trip.getSettledBy())
                .build();
    }

    // ═════════════════════════════════════════════════════════════════
    // EOD SETTLEMENT SUBMISSION & RECONCILIATION
    // ═════════════════════════════════════════════════════════════════

    @Transactional
    public TripFinancialSummaryResponse submitEodSettlement(Long tripId, EodSettlementSubmitRequest request,
            String currentUser) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found with ID: " + tripId));

        BigDecimal cashCollected = request.getCashCollected() != null ? request.getCashCollected() : BigDecimal.ZERO;
        BigDecimal upiCollected = request.getUpiCollected() != null ? request.getUpiCollected() : BigDecimal.ZERO;
        BigDecimal totalCollected = cashCollected.add(upiCollected);

        List<Invoice> invoices = invoiceRepository.findByTripId(tripId);
        BigDecimal expectedImmediateCollection = invoices.stream()
                .filter(i -> i.getPaymentMode() == PaymentMode.CASH || i.getPaymentMode() == PaymentMode.UPI)
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal collVariance = totalCollected.subtract(expectedImmediateCollection);

        int totalInvVariance = 0;
        if (request.getActualProductCounts() != null && !request.getActualProductCounts().isEmpty()) {
            Map<Long, Integer> countMap = request.getActualProductCounts().stream()
                    .collect(Collectors.toMap(ProductCountEntry::getProductId,
                            ProductCountEntry::getActualRemainingCount, (a, b) -> b));

            for (TripItem item : trip.getItems()) {
                Integer actual = countMap.get(item.getProduct().getId());
                if (actual != null) {
                    int expected = Math.max(0,
                            item.getLoadedQuantity() - item.getSoldQuantity() - item.getReturnedQuantity());
                    int var = actual - expected;
                    item.setRemainingQuantity(actual);
                    item.setIsReconciled(var == 0);
                    totalInvVariance += Math.abs(var);
                } else {
                    int expected = Math.max(0,
                            item.getLoadedQuantity() - item.getSoldQuantity() - item.getReturnedQuantity());
                    item.setRemainingQuantity(expected);
                    item.setIsReconciled(true);
                }
            }
        }

        SettlementStatus settlementStatus = (collVariance.compareTo(BigDecimal.ZERO) == 0 && totalInvVariance == 0)
                ? SettlementStatus.SETTLED
                : SettlementStatus.DISCREPANCY;

        trip.setCashCollected(cashCollected);
        trip.setUpiCollected(upiCollected);
        trip.setTotalCollected(totalCollected);
        trip.setCollectionVariance(collVariance);
        trip.setInventoryVariance(totalInvVariance);
        trip.setSettlementStatus(settlementStatus);
        trip.setEodCompleted(true);
        trip.setEodSubmittedAt(ZonedDateTime.now());
        trip.setEodNotes(request.getNotes());
        trip.setSettledBy(currentUser);
        trip.setStatus(TripStatus.COMPLETED);
        trip.setCompletionTime(ZonedDateTime.now());
        trip.setReturnTime(ZonedDateTime.now());

        Trip updated = tripRepository.save(trip);
        log.info(
                "EOD Settlement submitted for trip {}: Total Collected: ₹{} | Coll Variance: ₹{} | Inv Variance: {} | Status: {}",
                updated.getTripNumber(), totalCollected, collVariance, totalInvVariance, settlementStatus);

        return getTripFinancialSummary(updated.getId());
    }

    // ═════════════════════════════════════════════════════════════════
    // TRIP DASHBOARD KPIS
    // ═════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Map<String, Object> getTripDashboardKpis() {
        LocalDate today = LocalDate.now();
        List<Trip> allTrips = tripRepository.findAll();

        List<Trip> todayTrips = allTrips.stream()
                .filter(t -> today.equals(t.getTripDate()))
                .collect(Collectors.toList());

        int todayCount = todayTrips.size();
        int completedCount = (int) allTrips.stream().filter(t -> t.getStatus() == TripStatus.COMPLETED).count();
        int activeCount = (int) allTrips.stream()
                .filter(t -> t.getStatus() == TripStatus.DISPATCHED || t.getStatus() == TripStatus.IN_PROGRESS).count();

        BigDecimal todaySales = todayTrips.stream()
                .map(t -> t.getTotalSalesAmount() != null ? t.getTotalSalesAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal todayCash = todayTrips.stream()
                .map(t -> t.getCashCollected() != null ? t.getCashCollected() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal todayUpi = todayTrips.stream()
                .map(t -> t.getUpiCollected() != null ? t.getUpiCollected() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalLoaded = todayTrips.stream()
                .mapToInt(t -> t.getTotalLoadedQuantity() != null ? t.getTotalLoadedQuantity() : 0).sum();
        int totalSold = todayTrips.stream()
                .mapToInt(t -> t.getTotalSoldQuantity() != null ? t.getTotalSoldQuantity() : 0).sum();
        int totalReturned = todayTrips.stream()
                .mapToInt(t -> t.getTotalReturnedQuantity() != null ? t.getTotalReturnedQuantity() : 0).sum();
        int totalRemaining = Math.max(0, totalLoaded - totalSold - totalReturned);

        BigDecimal totalBetaPaid = allTrips.stream()
                .filter(t -> t.getBetaPaymentStatus() == PaymentStatus.PAID)
                .map(t -> t.getBetaAmount() != null ? t.getBetaAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal otherExpenses = allTrips.stream()
                .map(t -> t.getOtherTripExpenses() != null ? t.getOtherTripExpenses() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> map = new HashMap<>();
        map.put("todayTripsCount", todayCount);
        map.put("completedTripsCount", completedCount);
        map.put("activeTripsCount", activeCount);
        map.put("todaySalesRevenue", todaySales);
        map.put("cashCollection", todayCash);
        map.put("upiCollection", todayUpi);
        map.put("totalProductsLoaded", totalLoaded);
        map.put("totalProductsSold", totalSold);
        map.put("totalProductsReturned", totalReturned);
        map.put("totalProductsRemaining", totalRemaining);
        map.put("totalBetaPaid", totalBetaPaid);
        map.put("otherTripExpenses", otherExpenses);
        return map;
    }

    // ═════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═════════════════════════════════════════════════════════════════

    private Integer getAvailableWarehouseStock(Long productId) {
        Integer total = finishedGoodsInventoryRepository.findTotalStockByProduct(productId);
        return total != null ? total : 0;
    }

    private Integer getDayOfWeek(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return (dayOfWeek.getValue() % 7);
    }

    private String generateTripNumber() {
        return "TRIP-" + System.currentTimeMillis();
    }

    private void performInventoryReconciliation(Trip trip) {
        for (TripItem item : trip.getItems()) {
            item.setIsReconciled(true);
        }
        trip.setIsReconciled(true);
    }

    private DispatchGroupDTO mapToDispatchGroupDTO(DispatchGroup group) {
        return DispatchGroupDTO.builder()
                .id(group.getId())
                .groupName(group.getGroupName())
                .salesPersonId(group.getSalesPerson() != null ? group.getSalesPerson().getId() : null)
                .salesPersonName(group.getSalesPerson() != null ? group.getSalesPerson().getFullName() : "N/A")
                .driverId(group.getDriver() != null ? group.getDriver().getId() : null)
                .driverName(group.getDriver() != null ? group.getDriver().getFullName() : "N/A")
                .vehicleId(group.getVehicle() != null ? group.getVehicle().getId() : null)
                .vehicleNumber(group.getVehicle() != null ? group.getVehicle().getVehicleNumber() : "N/A")
                .status(group.getStatus())
                .isActive(group.getIsActive())
                .build();
    }

    private RouteGroupDTO mapToRouteGroupDTO(RouteGroup route) {
        return RouteGroupDTO.builder()
                .id(route.getId())
                .routeName(route.getRouteName())
                .description(route.getDescription())
                .areaRegion(route.getAreaRegion())
                .isActive(route.getIsActive())
                .shopRoutes(route.getShopRoutes().stream()
                        .map(this::mapToShopRouteDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    private ShopRouteDTO mapToShopRouteDTO(ShopRoute shopRoute) {
        String[] dayNames = { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
        return ShopRouteDTO.builder()
                .id(shopRoute.getId())
                .shopId(shopRoute.getShop().getId())
                .shopCode(shopRoute.getShop().getShopCode())
                .shopName(shopRoute.getShop().getName())
                .shopAddress(shopRoute.getShop().getAddress())
                .visitDay(shopRoute.getVisitDay())
                .visitDayName(dayNames[shopRoute.getVisitDay()])
                .visitSequence(shopRoute.getVisitSequence())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TripDTO> getAllTrips() {
        return tripRepository.findAll()
                .stream()
                .map(this::mapToTripDTO)
                .collect(Collectors.toList());
    }

    private TripItemDTO mapToTripItemDTO(TripItem item) {
        if (item == null)
            return null;
        return TripItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productCode(item.getProduct() != null ? item.getProduct().getProductCode() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : "Product")
                .productMrp(item.getProduct() != null ? item.getProduct().getMrp() : BigDecimal.ZERO)
                .loadedQuantity(item.getLoadedQuantity() != null ? item.getLoadedQuantity() : 0)
                .availableQuantity(item.getAvailableQuantity() != null ? item.getAvailableQuantity() : 0)
                .soldQuantity(item.getSoldQuantity() != null ? item.getSoldQuantity() : 0)
                .returnedQuantity(item.getReturnedQuantity() != null ? item.getReturnedQuantity() : 0)
                .damagedQuantity(item.getDamagedQuantity() != null ? item.getDamagedQuantity() : 0)
                .remainingQuantity(item.getAvailableQuantity() != null ? item.getAvailableQuantity() : 0)
                .isReconciled(item.getIsReconciled())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private TripShopVisitDTO mapToTripShopVisitDTO(TripShopVisit visit) {
        if (visit == null)
            return null;
        return TripShopVisitDTO.builder()
                .id(visit.getId())
                .shopId(visit.getShop() != null ? visit.getShop().getId() : null)
                .shopCode(visit.getShop() != null ? visit.getShop().getShopCode() : null)
                .shopName(visit.getShop() != null ? visit.getShop().getName() : "Shop")
                .shopAddress(visit.getShop() != null ? visit.getShop().getAddress() : null)
                .shopOwnerName(visit.getShop() != null ? visit.getShop().getOwnerName() : null)
                .shopPhone(visit.getShop() != null ? visit.getShop().getPhone() : null)
                .visitSequence(visit.getVisitSequence())
                .status(visit.getStatus())
                .expectedVisitTime(visit.getExpectedVisitTime())
                .actualArrivalTime(visit.getActualArrivalTime())
                .actualDepartureTime(visit.getActualDepartureTime())
                .notes(visit.getNotes())
                .photoProofUrl(visit.getPhotoProofUrl())
                .digitalSignatureUrl(visit.getDigitalSignatureUrl())
                .createdAt(visit.getCreatedAt())
                .updatedAt(visit.getUpdatedAt())
                .build();
    }

    public TripDTO mapToTripDTO(Trip trip) {
        if (trip == null)
            return null;
        return TripDTO.builder()
                .id(trip.getId())
                .tripNumber(trip.getTripNumber())
                .tripDate(trip.getTripDate())
                .dispatchGroupId(trip.getDispatchGroup() != null ? trip.getDispatchGroup().getId() : null)
                .dispatchGroupName(trip.getDispatchGroup() != null ? trip.getDispatchGroup().getGroupName() : null)
                .salesPersonId(trip.getSalesPerson() != null ? trip.getSalesPerson().getId() : null)
                .salesPersonName(
                        trip.getSalesPerson() != null ? trip.getSalesPerson().getFullName() : "Sales Executive")
                .driverId(trip.getDriver() != null ? trip.getDriver().getId() : null)
                .driverName(trip.getDriver() != null ? trip.getDriver().getFullName() : "Driver")
                .vehicleId(trip.getVehicle() != null ? trip.getVehicle().getId() : null)
                .vehicleNumber(trip.getVehicle() != null ? trip.getVehicle().getVehicleNumber() : "Van")
                .vehicleModel(trip.getVehicle() != null ? trip.getVehicle().getModel() : "")
                .routeGroupId(trip.getRouteGroup() != null ? trip.getRouteGroup().getId() : null)
                .routeName(trip.getRouteName() != null ? trip.getRouteName() : "Standard Route")
                .areaRegion(trip.getRouteGroup() != null ? trip.getRouteGroup().getAreaRegion() : null)
                .status(trip.getStatus())
                .dispatchTime(trip.getDispatchTime())
                .startTime(trip.getStartTime())
                .returnTime(trip.getReturnTime())
                .completionTime(trip.getCompletionTime())
                .totalLoadedQuantity(trip.getTotalLoadedQuantity() != null ? trip.getTotalLoadedQuantity() : 0)
                .totalSoldQuantity(trip.getTotalSoldQuantity() != null ? trip.getTotalSoldQuantity() : 0)
                .totalReturnedQuantity(trip.getTotalReturnedQuantity() != null ? trip.getTotalReturnedQuantity() : 0)
                .totalDamagedQuantity(trip.getTotalDamagedQuantity() != null ? trip.getTotalDamagedQuantity() : 0)
                .totalSalesAmount(trip.getTotalSalesAmount() != null ? trip.getTotalSalesAmount() : BigDecimal.ZERO)
                .betaAmount(trip.getBetaAmount() != null ? trip.getBetaAmount() : BigDecimal.ZERO)
                .betaPaymentStatus(trip.getBetaPaymentStatus() != null ? trip.getBetaPaymentStatus().name() : "PENDING")
                .cashCollected(trip.getCashCollected() != null ? trip.getCashCollected() : BigDecimal.ZERO)
                .upiCollected(trip.getUpiCollected() != null ? trip.getUpiCollected() : BigDecimal.ZERO)
                .totalCollected(trip.getTotalCollected() != null ? trip.getTotalCollected() : BigDecimal.ZERO)
                .settlementStatus(trip.getSettlementStatus() != null ? trip.getSettlementStatus().name() : "PENDING")
                .eodCompleted(trip.getEodCompleted() != null ? trip.getEodCompleted() : false)
                .isReconciled(trip.getIsReconciled())
                .reconciliationNotes(trip.getReconciliationNotes())
                .totalShops(trip.getShopVisits() != null ? trip.getShopVisits().size() : 0)
                .completedShops(
                        trip.getShopVisits() != null
                                ? (int) trip.getShopVisits().stream()
                                        .filter(v -> v.getStatus() == ShopVisitStatus.COMPLETED).count()
                                : 0)
                .items(trip.getItems() != null
                        ? trip.getItems().stream().map(this::mapToTripItemDTO).collect(Collectors.toList())
                        : new ArrayList<>())
                .shopVisits(trip.getShopVisits() != null
                        ? trip.getShopVisits().stream().map(this::mapToTripShopVisitDTO).collect(Collectors.toList())
                        : new ArrayList<>())
                .createdBy(trip.getCreatedBy())
                .build();
    }

    /**
     * Get Trip Route geometry, shop visit sequence, and status for mobile & web map
     * rendering with accurate hop-by-hop road distances starting from Factory
     */
    @Transactional(readOnly = true)
    public RouteMapResponse getTripRouteMap(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with id: " + tripId));

        List<TripShopVisit> visits = tripShopVisitRepository.findByTripIdOrderByVisitSequence(tripId);
        List<RouteWaypointDto> waypoints = new ArrayList<>();

        double curLat = FACTORY_LAT;
        double curLng = FACTORY_LNG;
        double totalDistanceKm = 0.0;

        for (TripShopVisit v : visits) {
            Shop s = v.getShop();
            if (s != null) {
                double sLat = (s.getLatitude() != null && s.getLatitude().doubleValue() != 0.0) ? s.getLatitude().doubleValue() : curLat;
                double sLng = (s.getLongitude() != null && s.getLongitude().doubleValue() != 0.0) ? s.getLongitude().doubleValue() : curLng;
                
                double legDist = calculateRoadDistance(curLat, curLng, sLat, sLng);
                totalDistanceKm += legDist;
                int estMins = (int) Math.max(2, Math.round((legDist / 25.0) * 60.0));

                waypoints.add(RouteWaypointDto.builder()
                        .shopId(s.getId())
                        .shopCode(s.getShopCode())
                        .shopName(s.getName())
                        .ownerName(s.getOwnerName())
                        .phone(s.getPhone())
                        .address(s.getAddress())
                        .areaName(s.getAreaName())
                        .visitOrder(v.getVisitSequence())
                        .latitude(s.getLatitude())
                        .longitude(s.getLongitude())
                        .distanceFromPrevKm(legDist)
                        .estimatedMinutesFromPrev(estMins)
                        .build());

                curLat = sLat;
                curLng = sLng;
            }
        }

        // Return leg to Factory
        double returnLeg = calculateRoadDistance(curLat, curLng, FACTORY_LAT, FACTORY_LNG);
        totalDistanceKm += returnLeg;
        int totalEstDuration = (int) Math.max(10, Math.round((totalDistanceKm / 25.0) * 60.0));
        totalDistanceKm = Math.round(totalDistanceKm * 10.0) / 10.0;

        return RouteMapResponse.builder()
                .routeId(trip.getId())
                .routeCode(trip.getTripNumber())
                .routeName(trip.getRouteName())
                .startingHub("Central Factory & Distribution Hub")
                .startLatitude(BigDecimal.valueOf(FACTORY_LAT))
                .startLongitude(BigDecimal.valueOf(FACTORY_LNG))
                .startLocationName("Central Factory & Distribution Hub")
                .endLatitude(BigDecimal.valueOf(FACTORY_LAT))
                .endLongitude(BigDecimal.valueOf(FACTORY_LNG))
                .endLocationName("Central Factory & Distribution Hub")
                .totalDistanceKm(totalDistanceKm)
                .estimatedDurationMinutes(totalEstDuration)
                .isOutdated(false)
                .shops(waypoints)
                .build();
    }

    /**
     * Geofence verification comparing driver GPS coordinates with target shop
     */
    @Transactional(readOnly = true)
    public ProximityVerificationResponse verifyDriverProximity(Long tripId, Long shopId, Double driverLat,
            Double driverLng, Double radiusMeters) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found with id: " + shopId));

        double threshold = radiusMeters != null ? radiusMeters : 50.0;
        double sLat = shop.getLatitude() != null ? shop.getLatitude().doubleValue() : FACTORY_LAT;
        double sLng = shop.getLongitude() != null ? shop.getLongitude().doubleValue() : FACTORY_LNG;

        double dLat = Math.toRadians(sLat - driverLat);
        double dLng = Math.toRadians(sLng - driverLng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(driverLat)) * Math.cos(Math.toRadians(sLat)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanceMeters = Math.round((6371000.0 * c) * 10.0) / 10.0;

        boolean isWithin = distanceMeters <= threshold;

        return ProximityVerificationResponse.builder()
                .shopId(shop.getId())
                .shopName(shop.getName())
                .distanceMeters(distanceMeters)
                .isWithinRadius(isWithin)
                .status(isWithin ? "AT_SHOP" : "IN_TRANSIT")
                .message(isWithin
                        ? String.format("Verified at %s (within %.0f meters)", shop.getName(), distanceMeters)
                        : String.format("Approaching %s (%.0f meters away)", shop.getName(), distanceMeters))
                .build();
    }

    private DispatchGroup createDefaultDispatchGroup() {
        User driver = userRepository.findAll().stream().findFirst().orElse(null);
        User salesPerson = driver;
        Vehicle vehicle = vehicleRepository.findAll().stream().findFirst().orElse(null);

        DispatchGroup group = DispatchGroup.builder()
                .groupName("Default Dispatch Group")
                .driver(driver)
                .salesPerson(salesPerson)
                .vehicle(vehicle)
                .status(DispatchGroupStatus.ACTIVE)
                .isActive(true)
                .createdBy("system")
                .build();
        return dispatchGroupRepository.save(group);
    }
}
