package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.RouteOptimizationDTOs;
import com.breadfactory.erp.dto.TripCreateRequest;
import com.breadfactory.erp.dto.TripDTO;
import com.breadfactory.erp.dto.TripSettlementDTO.*;
import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.enums.TripStatus;
import com.breadfactory.erp.repository.TripRepository;
import com.breadfactory.erp.service.TripDispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TripController {

    private final TripDispatchService tripDispatchService;
    private final TripRepository tripRepository;

    /**
     * Get all trips
     */
    @GetMapping
    public ResponseEntity<List<TripDTO>> getAllTrips() {
        return ResponseEntity.ok(tripDispatchService.getAllTrips());
    }

    /**
     * Create and dispatch trip using legacy method (backward compatibility)
     */
    @PostMapping("/dispatch")
    public ResponseEntity<Trip> dispatchTrip(@Valid @RequestBody TripCreateRequest request) {
        return ResponseEntity.ok(tripDispatchService.createAndDispatchTrip(request));
    }

    /**
     * Create a new trip with dispatch group, route, items, and beta
     */
    @PostMapping
    public ResponseEntity<TripDTO> createTrip(
            @Valid @RequestBody TripCreateRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        TripDTO trip = tripDispatchService.createTrip(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(trip);
    }

    /**
     * Get active trip for a specific driver or sales executive
     */
    @GetMapping("/driver/{driverId}/active")
    public ResponseEntity<TripDTO> getActiveTrip(@PathVariable Long driverId) {
        TripDTO dto = tripDispatchService.getActiveTripDTOForUser(driverId);
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/sales/{salesPersonId}/active")
    public ResponseEntity<TripDTO> getActiveTripForSalesPerson(@PathVariable Long salesPersonId) {
        TripDTO dto = tripDispatchService.getActiveTripDTOForUser(salesPersonId);
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }

    /**
     * Update trip status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<TripDTO> updateTripStatus(@PathVariable Long id, @RequestParam TripStatus status) {
        Trip updated = tripDispatchService.updateTripStatus(id, status);
        return ResponseEntity.ok(tripDispatchService.mapToTripDTO(updated));
    }

    /**
     * Dispatch a trip (change from CONFIRMED/DRAFT to DISPATCHED)
     */
    @PostMapping("/{id}/dispatch")
    public ResponseEntity<TripDTO> dispatchTrip(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        TripDTO trip = tripDispatchService.dispatchTrip(id, username);
        return ResponseEntity.ok(trip);
    }

    /**
     * Start a trip (change from DISPATCHED/DRAFT to IN_PROGRESS with start timestamp)
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<TripDTO> startTrip(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "sales_person";
        TripDTO trip = tripDispatchService.startTrip(id, username);
        return ResponseEntity.ok(trip);
    }

    /**
     * Complete / End a trip (change from IN_PROGRESS to COMPLETED with return/completion timestamp and reconciliation)
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<TripDTO> completeTrip(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "sales_person";
        TripDTO trip = tripDispatchService.completeTrip(id, username);
        return ResponseEntity.ok(trip);
    }

    /**
     * Get Trip Beta details
     */
    @GetMapping("/{id}/beta")
    public ResponseEntity<TripBetaResponse> getTripBeta(@PathVariable Long id) {
        return ResponseEntity.ok(tripDispatchService.getTripBeta(id));
    }

    /**
     * Configure / set Trip Beta amount
     */
    @PostMapping("/{id}/beta")
    public ResponseEntity<TripBetaResponse> configureTripBeta(
            @PathVariable Long id,
            @RequestBody BetaConfigRequest request) {
        return ResponseEntity.ok(tripDispatchService.configureTripBeta(id, request));
    }

    /**
     * Pay / Disburse Trip Beta - posts to company expenses, updates cash/bank ledger, and posts journal entry
     */
    @PostMapping("/{id}/beta/pay")
    public ResponseEntity<TripBetaResponse> payTripBeta(
            @PathVariable Long id,
            @RequestBody BetaPaymentRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(tripDispatchService.payTripBeta(id, request, username));
    }

    /**
     * Get Live Truck Inventory for a trip (Loaded, Sold, Returned, Damaged, Remaining)
     */
    @GetMapping("/{id}/inventory")
    public ResponseEntity<TripLiveInventoryResponse> getTripLiveInventory(@PathVariable Long id) {
        return ResponseEntity.ok(tripDispatchService.getTripLiveInventory(id));
    }

    /**
     * Get comprehensive Financial & Operational Summary for a trip
     */
    @GetMapping("/{id}/summary")
    public ResponseEntity<TripFinancialSummaryResponse> getTripFinancialSummary(@PathVariable Long id) {
        return ResponseEntity.ok(tripDispatchService.getTripFinancialSummary(id));
    }

    /**
     * Submit EOD Settlement & Product/Payment Reconciliation from Mobile or Admin
     */
    @PostMapping("/{id}/eod")
    public ResponseEntity<TripFinancialSummaryResponse> submitEodSettlement(
            @PathVariable Long id,
            @RequestBody EodSettlementSubmitRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "driver";
        return ResponseEntity.ok(tripDispatchService.submitEodSettlement(id, request, username));
    }

    /**
     * Get Trip Dashboard KPIs
     */
    @GetMapping("/dashboard/kpis")
    public ResponseEntity<Map<String, Object>> getTripDashboardKpis() {
        return ResponseEntity.ok(tripDispatchService.getTripDashboardKpis());
    }

    /**
     * Get Trip visual route, shops with coordinates, and visit statuses for mobile & web map
     */
    @GetMapping("/{id}/route")
    public ResponseEntity<RouteOptimizationDTOs.RouteMapResponse> getTripRoute(@PathVariable Long id) {
        return ResponseEntity.ok(tripDispatchService.getTripRouteMap(id));
    }

    /**
     * Verify driver GPS location against shop coordinates (Geofence proximity check)
     */
    @PostMapping("/{id}/verify-proximity")
    public ResponseEntity<RouteOptimizationDTOs.ProximityVerificationResponse> verifyProximity(
            @PathVariable Long id,
            @RequestParam Long shopId,
            @RequestBody RouteOptimizationDTOs.ProximityVerificationRequest request) {
        return ResponseEntity.ok(tripDispatchService.verifyDriverProximity(
                id,
                shopId,
                request.getDriverLatitude(),
                request.getDriverLongitude(),
                request.getRadiusMeters()
        ));
    }

    /**
     * Delete a trip
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        if (tripRepository.existsById(id)) {
            tripRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
