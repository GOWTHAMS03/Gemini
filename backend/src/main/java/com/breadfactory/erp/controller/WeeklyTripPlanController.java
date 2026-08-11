package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.WeeklyTripPlanDTOs.*;
import com.breadfactory.erp.service.WeeklyTripPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/weekly-plans")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WeeklyTripPlanController {

    private final WeeklyTripPlanService weeklyPlanService;

    // ═══════════════════════════════════════════════════════════════
    // WEEKLY PLAN CRUD
    // ═══════════════════════════════════════════════════════════════

    @PostMapping
    public ResponseEntity<WeeklyPlanResponse> create(@RequestBody WeeklyPlanCreateRequest request) {
        return ResponseEntity.ok(weeklyPlanService.createWeeklyPlan(request, "admin"));
    }

    @GetMapping
    public ResponseEntity<List<WeeklyPlanResponse>> getAll() {
        return ResponseEntity.ok(weeklyPlanService.getAllWeeklyPlans());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeeklyPlanResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(weeklyPlanService.getWeeklyPlan(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WeeklyPlanResponse> update(
            @PathVariable Long id, @RequestBody WeeklyPlanCreateRequest request) {
        return ResponseEntity.ok(weeklyPlanService.updateWeeklyPlan(id, request, "admin"));
    }

    // ═══════════════════════════════════════════════════════════════
    // DAILY TRIP: ROUTE & SHOP ASSIGNMENT
    // ═══════════════════════════════════════════════════════════════

    @PutMapping("/{planId}/daily-trips/{day}/route")
    public ResponseEntity<DailyTripResponse> assignRoute(
            @PathVariable Long planId,
            @PathVariable String day,
            @RequestBody AssignRouteRequest request) {
        return ResponseEntity.ok(weeklyPlanService.assignRouteToDay(planId, day, request));
    }

    @PutMapping("/{planId}/daily-trips/{day}/shops")
    public ResponseEntity<DailyTripResponse> updateShops(
            @PathVariable Long planId,
            @PathVariable String day,
            @RequestBody UpdateShopsRequest request) {
        return ResponseEntity.ok(weeklyPlanService.updateShopsForDay(planId, day, request));
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLISH / CANCEL
    // ═══════════════════════════════════════════════════════════════

    @PostMapping("/{id}/publish")
    public ResponseEntity<WeeklyPlanResponse> publish(@PathVariable Long id) {
        return ResponseEntity.ok(weeklyPlanService.publishWeeklyPlan(id, "admin"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<WeeklyPlanResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(weeklyPlanService.cancelWeeklyPlan(id, "admin"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        weeklyPlanService.deleteWeeklyPlan(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<WeeklyPlanResponse> duplicate(
            @PathVariable Long id,
            @RequestParam(required = false) String targetWeekStartDate) {
        java.time.LocalDate startDate = targetWeekStartDate != null && !targetWeekStartDate.isBlank()
                ? java.time.LocalDate.parse(targetWeekStartDate)
                : java.time.LocalDate.now().plusDays(7).with(java.time.DayOfWeek.MONDAY);
        return ResponseEntity.ok(weeklyPlanService.duplicateWeeklyPlan(id, startDate, "admin"));
    }

    // ═══════════════════════════════════════════════════════════════
    // MOBILE APIs
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/mobile/today")
    public ResponseEntity<?> getTodaysTrip(@RequestParam Long userId) {
        DailyTripResponse trip = weeklyPlanService.getTodaysTrip(userId);
        if (trip == null) {
            return ResponseEntity.ok(java.util.Map.of("message", "No trip assigned for today"));
        }
        return ResponseEntity.ok(trip);
    }

    @GetMapping("/mobile/weekly")
    public ResponseEntity<List<DailyTripResponse>> getWeeklyTrips(@RequestParam Long userId) {
        return ResponseEntity.ok(weeklyPlanService.getWeeklyTripsForUser(userId));
    }

    @PostMapping("/mobile/daily-trips/{id}/start")
    public ResponseEntity<DailyTripResponse> startTrip(@PathVariable Long id) {
        return ResponseEntity.ok(weeklyPlanService.startDailyTrip(id));
    }

    @PostMapping("/mobile/daily-trips/{id}/complete")
    public ResponseEntity<DailyTripResponse> completeTrip(@PathVariable Long id) {
        return ResponseEntity.ok(weeklyPlanService.completeDailyTrip(id));
    }

    @PutMapping("/mobile/shops/{tripShopId}/status")
    public ResponseEntity<DailyShopResponse> updateShopVisitStatus(
            @PathVariable Long tripShopId,
            @RequestBody UpdateShopVisitStatusRequest request) {
        return ResponseEntity.ok(weeklyPlanService.updateShopVisitStatus(tripShopId, request));
    }

    @GetMapping("/mobile/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications(@RequestParam Long userId) {
        return ResponseEntity.ok(weeklyPlanService.getNotificationsForUser(userId));
    }

    @PutMapping("/mobile/notifications/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        weeklyPlanService.markNotificationRead(id);
        return ResponseEntity.ok().build();
    }
}
