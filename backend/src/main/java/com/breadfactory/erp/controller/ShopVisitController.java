package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.TripShopVisit;
import com.breadfactory.erp.repository.TripShopVisitRepository;
import com.breadfactory.erp.repository.TripRepository;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/trip-visits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShopVisitController {

    private final TripShopVisitRepository tripShopVisitRepository;
    private final TripRepository tripRepository;

    // ─── DTOs ──────────────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShopVisitUpdateRequest {
        private String status;
        private String expectedVisitTime;
        private String actualArrivalTime;
        private String actualDepartureTime;
        private Integer productsQty;
        private Double billAmount;
        private Double collectionAmount;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShopVisitResponseDto {
        private Long id;
        private Long tripId;
        private String tripNumber;
        private Long shopId;
        private Map<String, Object> shop;
        private Integer visitSequence;
        private String status;
        private String expectedVisitTime;
        private String actualArrivalTime;
        private String actualDepartureTime;
        private Integer productsQty;
        private Double billAmount;
        private Double collectionAmount;
        private String notes;
        private String createdAt;
        private String updatedAt;
    }

    // ─── Get all shop visits for a trip ─────────────────────────────────────────

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<List<ShopVisitResponseDto>> getShopVisitsByTrip(@PathVariable Long tripId) {
        return tripRepository.findById(tripId)
                .map(trip -> {
                    List<TripShopVisit> visits = tripShopVisitRepository.findByTripIdOrderByVisitSequence(tripId);
                    List<ShopVisitResponseDto> dtos = visits.stream()
                            .map(this::mapToDto)
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(dtos);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Get single shop visit ──────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ShopVisitResponseDto> getShopVisit(@PathVariable Long id) {
        return tripShopVisitRepository.findById(id)
                .map(visit -> ResponseEntity.ok(mapToDto(visit)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Update shop visit ──────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> updateShopVisit(
            @PathVariable Long id,
            @RequestBody ShopVisitUpdateRequest request) {

        return tripShopVisitRepository.findById(id)
                .map(visit -> {
                    if (request.getStatus() != null && !request.getStatus().isBlank()) {
                        try {
                            visit.setStatus(com.breadfactory.erp.enums.ShopVisitStatus.valueOf(request.getStatus().toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.badRequest().body("Invalid status: " + request.getStatus());
                        }
                    }

                    if (request.getExpectedVisitTime() != null && !request.getExpectedVisitTime().isBlank()) {
                        visit.setExpectedVisitTime(java.time.LocalTime.parse(request.getExpectedVisitTime()));
                    }

                    if (request.getActualArrivalTime() != null && !request.getActualArrivalTime().isBlank()) {
                        visit.setActualArrivalTime(java.time.ZonedDateTime.parse(request.getActualArrivalTime()));
                    }

                    if (request.getActualDepartureTime() != null && !request.getActualDepartureTime().isBlank()) {
                        visit.setActualDepartureTime(java.time.ZonedDateTime.parse(request.getActualDepartureTime()));
                    }

                    if (request.getProductsQty() != null) {
                        visit.setProductsQty(request.getProductsQty());
                    }

                    if (request.getBillAmount() != null) {
                        visit.setBillAmount(request.getBillAmount());
                    }

                    if (request.getCollectionAmount() != null) {
                        visit.setCollectionAmount(request.getCollectionAmount());
                    }

                    if (request.getNotes() != null && !request.getNotes().isBlank()) {
                        visit.setNotes(request.getNotes());
                    }

                    TripShopVisit updated = tripShopVisitRepository.save(visit);
                    return ResponseEntity.ok(mapToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────────

    private ShopVisitResponseDto mapToDto(TripShopVisit visit) {
        Map<String, Object> shopInfo = new HashMap<>();
        if (visit.getShop() != null) {
            shopInfo.put("id", visit.getShop().getId());
            shopInfo.put("shopName", visit.getShop().getName());
            shopInfo.put("location", visit.getShop().getAddress());
            shopInfo.put("ownerName", visit.getShop().getOwnerName());
            shopInfo.put("phone", visit.getShop().getPhone());
        }

        return ShopVisitResponseDto.builder()
                .id(visit.getId())
                .tripId(visit.getTrip().getId())
                .tripNumber(visit.getTrip().getTripNumber())
                .shopId(visit.getShop().getId())
                .shop(shopInfo)
                .visitSequence(visit.getVisitSequence())
                .status(visit.getStatus().toString())
                .expectedVisitTime(visit.getExpectedVisitTime() != null ? visit.getExpectedVisitTime().toString() : null)
                .actualArrivalTime(visit.getActualArrivalTime() != null ? visit.getActualArrivalTime().toString() : null)
                .actualDepartureTime(visit.getActualDepartureTime() != null ? visit.getActualDepartureTime().toString() : null)
                .productsQty(visit.getProductsQty())
                .billAmount(visit.getBillAmount())
                .collectionAmount(visit.getCollectionAmount())
                .notes(visit.getNotes())
                .createdAt(visit.getCreatedAt() != null ? visit.getCreatedAt().toString() : null)
                .updatedAt(visit.getUpdatedAt() != null ? visit.getUpdatedAt().toString() : null)
                .build();
    }
}
