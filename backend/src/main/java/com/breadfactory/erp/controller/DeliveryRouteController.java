package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.RouteOptimizationDTOs.*;
import com.breadfactory.erp.entity.DeliveryRoute;
import com.breadfactory.erp.entity.RouteShop;
import com.breadfactory.erp.entity.Shop;
import com.breadfactory.erp.repository.DeliveryRouteRepository;
import com.breadfactory.erp.repository.RouteShopRepository;
import com.breadfactory.erp.repository.ShopRepository;
import com.breadfactory.erp.service.RouteOptimizationService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/routes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeliveryRouteController {

    private final DeliveryRouteRepository deliveryRouteRepository;
    private final RouteShopRepository routeShopRepository;
    private final ShopRepository shopRepository;
    private final RouteOptimizationService routeOptimizationService;

    // ─── DTOs ──────────────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteShopDto {
        private Long id;
        private Long shopId;
        private String shopCode;
        private String shopName;
        private String ownerName;
        private String phone;
        private String address;
        private Integer visitOrder;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Double distanceFromPrevKm;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteResponseDto {
        private Long id;
        private String routeCode;
        private String routeName;
        private String description;
        private String startingHub;
        private BigDecimal startLatitude;
        private BigDecimal startLongitude;
        private String startLocationName;
        private BigDecimal endLatitude;
        private BigDecimal endLongitude;
        private String endLocationName;
        private String assignedDriver;
        private String driverPhone;
        private String assignedVehicle;
        private Integer totalShops;
        private Double totalDistanceKm;
        private Double distanceKm;
        private String dispatchTime;
        private String estimatedDuration;
        private Integer estimatedDurationMinutes;
        private Boolean isOutdated;
        private Boolean optimizedOrderApplied;
        private String geometryGeojson;
        private String status;
        private String createdAt;
        private String updatedAt;
        private List<RouteShopDto> shops;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddShopsRequest {
        private List<Long> shopIds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReorderShopsRequest {
        private List<Long> shopIds; // Ordered list of shop IDs
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteCreateOrUpdateRequest {
        private String routeCode;
        private String routeName;
        private String description;
        private String startingHub;
        private BigDecimal startLatitude;
        private BigDecimal startLongitude;
        private String startLocationName;
        private BigDecimal endLatitude;
        private BigDecimal endLongitude;
        private String endLocationName;
        private String assignedDriver;
        private String driverPhone;
        private String assignedVehicle;
        private Integer totalShops;
        private Double totalDistanceKm;
        private Double distanceKm;
        private String dispatchTime;
        private String estimatedDuration;
        private Integer estimatedDurationMinutes;
        private String status;
        private List<Long> shopIds; // Optional initial shop IDs
    }

    // ─── Endpoints ─────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<RouteResponseDto>> getAll() {
        List<DeliveryRoute> routes = deliveryRouteRepository.findAll();
        List<RouteResponseDto> dtos = routes.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouteResponseDto> getById(@PathVariable Long id) {
        return deliveryRouteRepository.findById(id)
                .map(r -> ResponseEntity.ok(mapToDto(r)))
                .orElse(ResponseEntity.notFound().build());
    }


    /**
     * Smart TSP Route Optimization Preview
     */
    @PostMapping("/{id}/optimize")
    public ResponseEntity<RouteOptimizationPreviewResponse> previewOptimize(
            @PathVariable Long id,
            @RequestBody(required = false) RouteOptimizationRequest request) {
        RouteOptimizationPreviewResponse preview = routeOptimizationService.previewRouteOptimization(id, request);
        return ResponseEntity.ok(preview);
    }

    /**
     * Apply Optimized Route Sequence
     */
    @PutMapping("/{id}/apply-optimization")
    @Transactional
    public ResponseEntity<RouteResponseDto> applyOptimization(
            @PathVariable Long id,
            @RequestBody ReorderShopsRequest request) {
        DeliveryRoute updated = routeOptimizationService.applyOptimizedRouteOrder(id, request.getShopIds());
        return ResponseEntity.ok(mapToDto(updated));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<RouteResponseDto> create(@RequestBody RouteCreateOrUpdateRequest request) {
        String code = request.getRouteCode();
        if (code == null || code.isBlank()) {
            code = "RT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        DeliveryRoute route = DeliveryRoute.builder()
                .routeCode(code)
                .routeName(request.getRouteName() != null ? request.getRouteName().trim() : "New Route")
                .description(request.getDescription())
                .startingHub(request.getStartingHub() != null ? request.getStartingHub() : "Central Factory & Distribution Hub")
                .startLatitude(request.getStartLatitude() != null ? request.getStartLatitude() : BigDecimal.valueOf(10.787252191240228))
                .startLongitude(request.getStartLongitude() != null ? request.getStartLongitude() : BigDecimal.valueOf(79.57505803846621))
                .startLocationName(request.getStartLocationName() != null ? request.getStartLocationName() : "Central Factory & Distribution Hub")
                .endLatitude(request.getEndLatitude() != null ? request.getEndLatitude() : BigDecimal.valueOf(10.787252191240228))
                .endLongitude(request.getEndLongitude() != null ? request.getEndLongitude() : BigDecimal.valueOf(79.57505803846621))
                .endLocationName(request.getEndLocationName() != null ? request.getEndLocationName() : "Central Factory & Distribution Hub")
                .assignedDriver(request.getAssignedDriver())
                .driverPhone(request.getDriverPhone())
                .assignedVehicle(request.getAssignedVehicle())
                .totalShops(request.getTotalShops() != null ? request.getTotalShops() : 0)
                .totalDistanceKm(request.getTotalDistanceKm() != null ? request.getTotalDistanceKm() : (request.getDistanceKm() != null ? request.getDistanceKm() : 0.0))
                .distanceKm(request.getDistanceKm() != null ? request.getDistanceKm() : (request.getTotalDistanceKm() != null ? request.getTotalDistanceKm() : 0.0))
                .dispatchTime(request.getDispatchTime())
                .estimatedDuration(request.getEstimatedDuration())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes() != null ? request.getEstimatedDurationMinutes() : 45)
                .isOutdated(false)
                .status(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().toUpperCase() : "ACTIVE")
                .build();

        DeliveryRoute saved = deliveryRouteRepository.save(route);

        if (request.getShopIds() != null && !request.getShopIds().isEmpty()) {
            addShopsToRoute(saved, request.getShopIds());
        }

        return ResponseEntity.ok(mapToDto(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<RouteResponseDto> update(@PathVariable Long id, @RequestBody RouteCreateOrUpdateRequest details) {
        return deliveryRouteRepository.findById(id)
                .map(existing -> {
                    if (details.getRouteCode() != null && !details.getRouteCode().isBlank()) {
                        existing.setRouteCode(details.getRouteCode());
                    }
                    if (details.getRouteName() != null && !details.getRouteName().isBlank()) {
                        existing.setRouteName(details.getRouteName());
                    }
                    if (details.getDescription() != null) {
                        existing.setDescription(details.getDescription());
                    }
                    if (details.getStartingHub() != null) {
                        existing.setStartingHub(details.getStartingHub());
                    }
                    if (details.getStartLatitude() != null) {
                        existing.setStartLatitude(details.getStartLatitude());
                    }
                    if (details.getStartLongitude() != null) {
                        existing.setStartLongitude(details.getStartLongitude());
                    }
                    if (details.getStartLocationName() != null) {
                        existing.setStartLocationName(details.getStartLocationName());
                    }
                    if (details.getEndLatitude() != null) {
                        existing.setEndLatitude(details.getEndLatitude());
                    }
                    if (details.getEndLongitude() != null) {
                        existing.setEndLongitude(details.getEndLongitude());
                    }
                    if (details.getEndLocationName() != null) {
                        existing.setEndLocationName(details.getEndLocationName());
                    }
                    if (details.getAssignedDriver() != null) {
                        existing.setAssignedDriver(details.getAssignedDriver());
                    }
                    if (details.getDriverPhone() != null) {
                        existing.setDriverPhone(details.getDriverPhone());
                    }
                    if (details.getAssignedVehicle() != null) {
                        existing.setAssignedVehicle(details.getAssignedVehicle());
                    }
                    if (details.getTotalShops() != null) {
                        existing.setTotalShops(details.getTotalShops());
                    }
                    if (details.getTotalDistanceKm() != null) {
                        existing.setTotalDistanceKm(details.getTotalDistanceKm());
                        existing.setDistanceKm(details.getTotalDistanceKm());
                    } else if (details.getDistanceKm() != null) {
                        existing.setDistanceKm(details.getDistanceKm());
                        existing.setTotalDistanceKm(details.getDistanceKm());
                    }
                    if (details.getDispatchTime() != null) {
                        existing.setDispatchTime(details.getDispatchTime());
                    }
                    if (details.getEstimatedDuration() != null) {
                        existing.setEstimatedDuration(details.getEstimatedDuration());
                    }
                    if (details.getEstimatedDurationMinutes() != null) {
                        existing.setEstimatedDurationMinutes(details.getEstimatedDurationMinutes());
                    }
                    if (details.getStatus() != null && !details.getStatus().isBlank()) {
                        existing.setStatus(details.getStatus().toUpperCase());
                    }

                    if (details.getShopIds() != null) {
                        routeShopRepository.deleteByRouteId(existing.getId());
                        addShopsToRoute(existing, details.getShopIds());
                    }

                    DeliveryRoute updated = deliveryRouteRepository.save(existing);
                    return ResponseEntity.ok(mapToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (deliveryRouteRepository.existsById(id)) {
            routeShopRepository.deleteByRouteId(id);
            deliveryRouteRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{routeId}/shops")
    @Transactional
    public ResponseEntity<RouteResponseDto> addShops(
            @PathVariable Long routeId,
            @RequestBody AddShopsRequest request) {

        return deliveryRouteRepository.findById(routeId)
                .map(route -> {
                    if (request.getShopIds() != null && !request.getShopIds().isEmpty()) {
                        addShopsToRoute(route, request.getShopIds());
                    }
                    return ResponseEntity.ok(mapToDto(route));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{routeId}/shops/{shopId}")
    @Transactional
    public ResponseEntity<RouteResponseDto> removeShop(
            @PathVariable Long routeId,
            @PathVariable Long shopId) {

        return deliveryRouteRepository.findById(routeId)
                .map(route -> {
                    routeShopRepository.deleteByRouteIdAndShopId(routeId, shopId);
                    List<RouteShop> remaining = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(routeId);
                    for (int i = 0; i < remaining.size(); i++) {
                        remaining.get(i).setVisitOrder(i + 1);
                    }
                    routeShopRepository.saveAll(remaining);
                    route.setTotalShops(remaining.size());
                    deliveryRouteRepository.save(route);
                    return ResponseEntity.ok(mapToDto(route));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{routeId}/shops/order")
    @Transactional
    public ResponseEntity<RouteResponseDto> reorderShops(
            @PathVariable Long routeId,
            @RequestBody ReorderShopsRequest request) {

        return deliveryRouteRepository.findById(routeId)
                .map(route -> {
                    if (request.getShopIds() != null) {
                        List<RouteShop> existing = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(routeId);
                        Map<Long, RouteShop> byShopId = existing.stream()
                                .filter(rs -> rs.getShop() != null)
                                .collect(Collectors.toMap(rs -> rs.getShop().getId(), rs -> rs, (a, b) -> a));

                        List<RouteShop> reordered = new ArrayList<>();
                        int order = 1;
                        for (Long sId : request.getShopIds()) {
                            RouteShop rs = byShopId.get(sId);
                            if (rs != null) {
                                rs.setVisitOrder(order++);
                                reordered.add(rs);
                            }
                        }
                        routeShopRepository.saveAll(reordered);
                        route.setTotalShops(reordered.size());
                        deliveryRouteRepository.save(route);
                    }
                    return ResponseEntity.ok(mapToDto(route));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private void addShopsToRoute(DeliveryRoute route, List<Long> shopIds) {
        List<RouteShop> existing = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(route.getId());
        Set<Long> existingShopIds = existing.stream()
                .filter(rs -> rs.getShop() != null)
                .map(rs -> rs.getShop().getId())
                .collect(Collectors.toSet());

        int nextOrder = existing.size() + 1;
        List<RouteShop> newRouteShops = new ArrayList<>();

        for (Long sId : shopIds) {
            if (!existingShopIds.contains(sId)) {
                Optional<Shop> shopOpt = shopRepository.findById(sId);
                if (shopOpt.isPresent()) {
                    Shop shop = shopOpt.get();
                    RouteShop rs = RouteShop.builder()
                            .route(route)
                            .shop(shop)
                            .shopName(shop.getName())
                            .address(shop.getAddress())
                            .visitOrder(nextOrder++)
                            .latitude(shop.getLatitude())
                            .longitude(shop.getLongitude())
                            .distanceFromPrevKm(BigDecimal.valueOf(2.5))
                            .build();
                    newRouteShops.add(rs);
                    existingShopIds.add(sId);
                }
            }
        }

        if (!newRouteShops.isEmpty()) {
            routeShopRepository.saveAll(newRouteShops);
            route.setTotalShops(existing.size() + newRouteShops.size());
            deliveryRouteRepository.save(route);
        }
    }

    private RouteResponseDto mapToDto(DeliveryRoute route) {
        List<RouteShop> rShops = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(route.getId());
        
        List<RouteShopDto> shopDtos = rShops.stream().map(rs -> {
            Shop s = rs.getShop();
            return RouteShopDto.builder()
                    .id(rs.getId())
                    .shopId(s != null ? s.getId() : null)
                    .shopCode(s != null ? s.getShopCode() : null)
                    .shopName(s != null ? s.getName() : (rs.getShopName() != null ? rs.getShopName() : "Shop"))
                    .ownerName(s != null ? s.getOwnerName() : null)
                    .phone(s != null ? s.getPhone() : null)
                    .address(s != null ? s.getAddress() : rs.getAddress())
                    .visitOrder(rs.getVisitOrder())
                    .latitude(rs.getLatitude() != null ? rs.getLatitude() : (s != null ? s.getLatitude() : null))
                    .longitude(rs.getLongitude() != null ? rs.getLongitude() : (s != null ? s.getLongitude() : null))
                    .distanceFromPrevKm(rs.getDistanceFromPrevKm() != null ? rs.getDistanceFromPrevKm().doubleValue() : 0.0)
                    .build();
        }).collect(Collectors.toList());

        return RouteResponseDto.builder()
                .id(route.getId())
                .routeCode(route.getRouteCode())
                .routeName(route.getRouteName())
                .description(route.getDescription())
                .startingHub(route.getStartingHub())
                .startLatitude(route.getStartLatitude())
                .startLongitude(route.getStartLongitude())
                .startLocationName(route.getStartLocationName())
                .endLatitude(route.getEndLatitude())
                .endLongitude(route.getEndLongitude())
                .endLocationName(route.getEndLocationName())
                .assignedDriver(route.getAssignedDriver())
                .driverPhone(route.getDriverPhone())
                .assignedVehicle(route.getAssignedVehicle())
                .totalShops(shopDtos.size())
                .totalDistanceKm(route.getTotalDistanceKm() != null ? route.getTotalDistanceKm() : route.getDistanceKm())
                .distanceKm(route.getDistanceKm() != null ? route.getDistanceKm() : route.getTotalDistanceKm())
                .dispatchTime(route.getDispatchTime())
                .estimatedDuration(route.getEstimatedDuration())
                .estimatedDurationMinutes(route.getEstimatedDurationMinutes())
                .isOutdated(route.getIsOutdated())
                .optimizedOrderApplied(route.getOptimizedOrderApplied())
                .geometryGeojson(route.getGeometryGeojson())
                .status(route.getStatus() != null ? route.getStatus() : "ACTIVE")
                .createdAt(route.getCreatedAt() != null ? route.getCreatedAt().toString() : null)
                .updatedAt(route.getUpdatedAt() != null ? route.getUpdatedAt().toString() : null)
                .shops(shopDtos)
                .build();
    }



    /**
     * PUT /routes/{routeId}/optimize/apply
     * Applies the optimized shop visit order
     */
    @PutMapping("/{routeId}/optimize/apply")
    @Transactional
    public ResponseEntity<?> applyOptimization(
            @PathVariable Long routeId,
            @RequestBody List<Long> optimizedShopIds) {
        try {
            DeliveryRoute updated = routeOptimizationService.applyOptimizedRouteOrder(routeId, optimizedShopIds);
            return ResponseEntity.ok(mapToDto(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /routes/{routeId}/map
     * Returns route map data with shop waypoints and geometry for map rendering
     */
    @GetMapping("/{routeId}/map")
    public ResponseEntity<RouteMapResponse> getRouteMap(@PathVariable Long routeId) {
        Optional<DeliveryRoute> routeOpt = deliveryRouteRepository.findById(routeId);
        if (routeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DeliveryRoute route = routeOpt.get();
        List<RouteShop> routeShops = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(routeId);

        List<RouteWaypointDto> waypointDtos = routeShops.stream().map(rs -> {
            Shop s = rs.getShop();
            return RouteWaypointDto.builder()
                    .shopId(s != null ? s.getId() : rs.getId())
                    .shopCode(s != null ? s.getShopCode() : "")
                    .shopName(s != null ? s.getName() : (rs.getShopName() != null ? rs.getShopName() : "Shop"))
                    .ownerName(s != null ? s.getOwnerName() : null)
                    .phone(s != null ? s.getPhone() : null)
                    .address(s != null ? s.getAddress() : rs.getAddress())
                    .areaName(s != null ? s.getAreaName() : null)
                    .visitOrder(rs.getVisitOrder())
                    .latitude(rs.getLatitude() != null ? rs.getLatitude() : (s != null ? s.getLatitude() : null))
                    .longitude(rs.getLongitude() != null ? rs.getLongitude() : (s != null ? s.getLongitude() : null))
                    .distanceFromPrevKm(rs.getDistanceFromPrevKm() != null ? rs.getDistanceFromPrevKm().doubleValue() : 0.0)
                    .build();
        }).collect(Collectors.toList());

        // Parse geometry from stored JSON
        List<List<Double>> geometry = new ArrayList<>();
        if (route.getGeometryGeojson() != null && !route.getGeometryGeojson().isEmpty()) {
            try {
                // If stored as JSON array string, parse it
                // For simplicity, generate from waypoints if parsing fails
                geometry = waypointDtos.stream()
                        .filter(w -> w.getLatitude() != null && w.getLongitude() != null)
                        .map(w -> List.of(w.getLatitude().doubleValue(), w.getLongitude().doubleValue()))
                        .collect(Collectors.toList());
            } catch (Exception e) {
                // Fallback: just use waypoint coords
            }
        }
        if (geometry.isEmpty()) {
            geometry = waypointDtos.stream()
                    .filter(w -> w.getLatitude() != null && w.getLongitude() != null)
                    .map(w -> List.of(w.getLatitude().doubleValue(), w.getLongitude().doubleValue()))
                    .collect(Collectors.toList());
        }

        RouteMapResponse mapResponse = RouteMapResponse.builder()
                .routeId(route.getId())
                .routeCode(route.getRouteCode())
                .routeName(route.getRouteName())
                .startingHub(route.getStartingHub())
                .startLatitude(route.getStartLatitude())
                .startLongitude(route.getStartLongitude())
                .startLocationName(route.getStartLocationName())
                .endLatitude(route.getEndLatitude())
                .endLongitude(route.getEndLongitude())
                .endLocationName(route.getEndLocationName())
                .totalDistanceKm(route.getTotalDistanceKm() != null ? route.getTotalDistanceKm() : 0.0)
                .estimatedDurationMinutes(route.getEstimatedDurationMinutes())
                .isOutdated(route.getIsOutdated())
                .shops(waypointDtos)
                .geometryGeojson(geometry)
                .encodedPolyline(route.getGeometryGeojson())
                .build();

        return ResponseEntity.ok(mapResponse);
    }
}

