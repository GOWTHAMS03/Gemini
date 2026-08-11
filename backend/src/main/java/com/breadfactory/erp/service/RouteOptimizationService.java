package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.RouteOptimizationDTOs.*;
import com.breadfactory.erp.entity.DeliveryRoute;
import com.breadfactory.erp.entity.RouteShop;
import com.breadfactory.erp.entity.Shop;
import com.breadfactory.erp.repository.DeliveryRouteRepository;
import com.breadfactory.erp.repository.RouteShopRepository;
import com.breadfactory.erp.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RouteOptimizationService {

    private final DeliveryRouteRepository deliveryRouteRepository;
    private final RouteShopRepository routeShopRepository;
    private final ShopRepository shopRepository;

    private static final double DEFAULT_HUB_LAT = 10.787252191240228;
    private static final double DEFAULT_HUB_LNG = 79.57505803846621;
    private static final String DEFAULT_HUB_NAME = "Central Factory & Distribution Hub";

    /**
     * Previews Traveling Salesperson Problem (TSP) road route optimization
     */
    @Transactional(readOnly = true)
    public RouteOptimizationPreviewResponse previewRouteOptimization(Long routeId, RouteOptimizationRequest customRequest) {
        DeliveryRoute route = deliveryRouteRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery Route not found with id: " + routeId));

        List<RouteShop> existingRouteShops = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(routeId);
        List<Shop> targetShops = new ArrayList<>();

        if (customRequest != null && customRequest.getShopIds() != null && !customRequest.getShopIds().isEmpty()) {
            for (Long sId : customRequest.getShopIds()) {
                shopRepository.findById(sId).ifPresent(targetShops::add);
            }
        } else {
            targetShops = existingRouteShops.stream()
                    .map(RouteShop::getShop)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        // Check for missing locations
        List<RouteWaypointDto> missingShops = new ArrayList<>();
        List<Shop> validShops = new ArrayList<>();

        for (Shop s : targetShops) {
            if (s.getLatitude() == null || s.getLongitude() == null ||
                (s.getLatitude().compareTo(BigDecimal.ZERO) == 0 && s.getLongitude().compareTo(BigDecimal.ZERO) == 0)) {
                missingShops.add(mapShopToWaypoint(s, 0, 0.0, 0));
            } else {
                validShops.add(s);
            }
        }

        double startLat = (customRequest != null && customRequest.getStartLatitude() != null)
                ? customRequest.getStartLatitude().doubleValue()
                : (route.getStartLatitude() != null ? route.getStartLatitude().doubleValue() : DEFAULT_HUB_LAT);

        double startLng = (customRequest != null && customRequest.getStartLongitude() != null)
                ? customRequest.getStartLongitude().doubleValue()
                : (route.getStartLongitude() != null ? route.getStartLongitude().doubleValue() : DEFAULT_HUB_LNG);

        double endLat = (customRequest != null && customRequest.getEndLatitude() != null)
                ? customRequest.getEndLatitude().doubleValue()
                : (route.getEndLatitude() != null ? route.getEndLatitude().doubleValue() : DEFAULT_HUB_LAT);

        double endLng = (customRequest != null && customRequest.getEndLongitude() != null)
                ? customRequest.getEndLongitude().doubleValue()
                : (route.getEndLongitude() != null ? route.getEndLongitude().doubleValue() : DEFAULT_HUB_LNG);

        // Compute current order distances
        List<RouteWaypointDto> currentOrderDtos = new ArrayList<>();
        double currentDist = calculateSequentialRoadDistance(startLat, startLng, validShops, endLat, endLng, currentOrderDtos);

        // Run TSP 2-Opt Optimization on valid shops
        List<Shop> optimizedShops = solveTspRoadRoute(startLat, startLng, validShops, endLat, endLng);
        List<RouteWaypointDto> suggestedOrderDtos = new ArrayList<>();
        double optimizedDist = calculateSequentialRoadDistance(startLat, startLng, optimizedShops, endLat, endLng, suggestedOrderDtos);

        // Ensure realistic optimization saving if order was unoptimized
        if (optimizedDist > currentDist) {
            optimizedDist = currentDist;
            suggestedOrderDtos = currentOrderDtos;
        }

        double distanceSaved = Math.max(0.0, Math.round((currentDist - optimizedDist) * 10.0) / 10.0);
        double pctSaved = currentDist > 0 ? Math.round((distanceSaved / currentDist) * 1000.0) / 10.0 : 0.0;
        int durationMinutes = (int) Math.round((optimizedDist / 25.0) * 60.0 + (optimizedShops.size() * 6.0)); // 25 km/h avg speed + 6 mins per stop

        // Generate GeoJSON coordinate array [[lng, lat], ...]
        List<List<Double>> geometry = generateRoutePolylineWaypoints(startLat, startLng, optimizedShops, endLat, endLng);

        String explanation = String.format(
                "Optimization reduced backtracking across %d stops. Estimated travel distance improved from %.1f KM to %.1f KM, saving %.1f KM (%.1f%% road efficiency gain).",
                optimizedShops.size(), currentDist, optimizedDist, distanceSaved, pctSaved
        );

        return RouteOptimizationPreviewResponse.builder()
                .routeId(route.getId())
                .routeCode(route.getRouteCode())
                .routeName(route.getRouteName())
                .currentDistanceKm(Math.round(currentDist * 10.0) / 10.0)
                .optimizedDistanceKm(Math.round(optimizedDist * 10.0) / 10.0)
                .distanceSavedKm(distanceSaved)
                .percentageSaved(pctSaved)
                .estimatedDurationMinutes(durationMinutes)
                .currentOrder(currentOrderDtos)
                .suggestedOrder(suggestedOrderDtos)
                .geometryGeojson(geometry)
                .encodedPolyline("LINESTRING_" + route.getRouteCode())
                .explanation(explanation)
                .missingLocationShops(missingShops)
                .hasMissingLocations(!missingShops.isEmpty())
                .build();
    }

    /**
     * Applies the suggested optimized order and saves updated route distance & geometry
     */
    @Transactional
    public DeliveryRoute applyOptimizedRouteOrder(Long routeId, List<Long> optimizedShopIds) {
        DeliveryRoute route = deliveryRouteRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found with id: " + routeId));

        if (optimizedShopIds == null || optimizedShopIds.isEmpty()) {
            return route;
        }

        List<RouteShop> existing = routeShopRepository.findByRouteIdOrderByVisitOrderAsc(routeId);
        Map<Long, RouteShop> byShopId = existing.stream()
                .filter(rs -> rs.getShop() != null)
                .collect(Collectors.toMap(rs -> rs.getShop().getId(), rs -> rs, (a, b) -> a));

        List<RouteShop> reordered = new ArrayList<>();
        List<Shop> orderedShops = new ArrayList<>();
        int order = 1;

        double prevLat = route.getStartLatitude() != null ? route.getStartLatitude().doubleValue() : DEFAULT_HUB_LAT;
        double prevLng = route.getStartLongitude() != null ? route.getStartLongitude().doubleValue() : DEFAULT_HUB_LNG;

        for (Long sId : optimizedShopIds) {
            RouteShop rs = byShopId.get(sId);
            if (rs != null) {
                rs.setVisitOrder(order++);
                Shop s = rs.getShop();
                if (s != null) {
                    orderedShops.add(s);
                    rs.setShopName(s.getName());
                    rs.setAddress(s.getAddress());
                    if (s.getLatitude() != null && s.getLongitude() != null) {
                        rs.setLatitude(s.getLatitude());
                        rs.setLongitude(s.getLongitude());
                        double distFromPrev = calculateRoadDistance(prevLat, prevLng, s.getLatitude().doubleValue(), s.getLongitude().doubleValue());
                        rs.setDistanceFromPrevKm(BigDecimal.valueOf(distFromPrev).setScale(2, RoundingMode.HALF_UP));
                        prevLat = s.getLatitude().doubleValue();
                        prevLng = s.getLongitude().doubleValue();
                    }
                }
                reordered.add(rs);
            }
        }

        routeShopRepository.saveAll(reordered);

        // Recalculate total distance and geometry
        double endLat = route.getEndLatitude() != null ? route.getEndLatitude().doubleValue() : DEFAULT_HUB_LAT;
        double endLng = route.getEndLongitude() != null ? route.getEndLongitude().doubleValue() : DEFAULT_HUB_LNG;
        double totalDist = calculateTotalRouteDistance(route.getStartLatitude().doubleValue(), route.getStartLongitude().doubleValue(), orderedShops, endLat, endLng);
        int durationMinutes = (int) Math.round((totalDist / 25.0) * 60.0 + (orderedShops.size() * 6.0));

        route.setTotalShops(reordered.size());
        route.setTotalDistanceKm(Math.round(totalDist * 10.0) / 10.0);
        route.setDistanceKm(Math.round(totalDist * 10.0) / 10.0);
        route.setEstimatedDurationMinutes(durationMinutes);
        route.setEstimatedDuration(formatDurationHoursMinutes(durationMinutes));
        route.setOptimizedOrderApplied(true);
        route.setIsOutdated(false);

        List<List<Double>> geometry = generateRoutePolylineWaypoints(route.getStartLatitude().doubleValue(), route.getStartLongitude().doubleValue(), orderedShops, endLat, endLng);
        route.setGeometryGeojson(geometry.toString());

        return deliveryRouteRepository.save(route);
    }

    /**
     * Flags any delivery route containing the updated shop as outdated
     */
    @Transactional
    public void markRoutesOutdatedForShop(Long shopId) {
        List<RouteShop> routeShops = routeShopRepository.findByShopId(shopId);
        for (RouteShop rs : routeShops) {
            DeliveryRoute route = rs.getRoute();
            if (route != null) {
                route.setIsOutdated(true);
                deliveryRouteRepository.save(route);
            }
        }
    }

    /**
     * TSP Solver: 2-Opt Heuristic minimizing road network travel distance
     */
    private List<Shop> solveTspRoadRoute(double startLat, double startLng, List<Shop> shops, double endLat, double endLng) {
        if (shops.size() <= 2) {
            return new ArrayList<>(shops);
        }

        // 1. Initial Nearest Neighbor Tour
        List<Shop> unvisited = new ArrayList<>(shops);
        List<Shop> tour = new ArrayList<>();
        double curLat = startLat;
        double curLng = startLng;

        while (!unvisited.isEmpty()) {
            Shop nearest = null;
            double minDist = Double.MAX_VALUE;
            for (Shop s : unvisited) {
                double dist = calculateRoadDistance(curLat, curLng, s.getLatitude().doubleValue(), s.getLongitude().doubleValue());
                if (dist < minDist) {
                    minDist = dist;
                    nearest = s;
                }
            }
            if (nearest != null) {
                tour.add(nearest);
                unvisited.remove(nearest);
                curLat = nearest.getLatitude().doubleValue();
                curLng = nearest.getLongitude().doubleValue();
            } else {
                break;
            }
        }

        // 2. 2-Opt Iterative Improvement
        boolean improved = true;
        int maxIterations = 50;
        int iter = 0;

        while (improved && iter++ < maxIterations) {
            improved = false;
            double bestDist = calculateTotalRouteDistance(startLat, startLng, tour, endLat, endLng);

            for (int i = 0; i < tour.size() - 1; i++) {
                for (int k = i + 1; k < tour.size(); k++) {
                    List<Shop> newTour = twoOptSwap(tour, i, k);
                    double newDist = calculateTotalRouteDistance(startLat, startLng, newTour, endLat, endLng);
                    if (newDist < bestDist - 0.05) { // At least 50m improvement
                        tour = newTour;
                        bestDist = newDist;
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
        }

        return tour;
    }

    private List<Shop> twoOptSwap(List<Shop> tour, int i, int k) {
        List<Shop> newTour = new ArrayList<>();
        for (int c = 0; c < i; c++) {
            newTour.add(tour.get(c));
        }
        for (int c = k; c >= i; c--) {
            newTour.add(tour.get(c));
        }
        for (int c = k + 1; c < tour.size(); c++) {
            newTour.add(tour.get(c));
        }
        return newTour;
    }

    private double calculateSequentialRoadDistance(double startLat, double startLng, List<Shop> shops, double endLat, double endLng, List<RouteWaypointDto> waypointCollector) {
        double totalDist = 0.0;
        double curLat = startLat;
        double curLng = startLng;
        int order = 1;

        for (Shop s : shops) {
            double sLat = s.getLatitude() != null ? s.getLatitude().doubleValue() : curLat;
            double sLng = s.getLongitude() != null ? s.getLongitude().doubleValue() : curLng;
            double legDist = calculateRoadDistance(curLat, curLng, sLat, sLng);
            totalDist += legDist;

            int estMins = (int) Math.max(2, Math.round((legDist / 25.0) * 60.0));
            waypointCollector.add(mapShopToWaypoint(s, order++, legDist, estMins));

            curLat = sLat;
            curLng = sLng;
        }

        // Return leg to end depot
        totalDist += calculateRoadDistance(curLat, curLng, endLat, endLng);
        return totalDist;
    }

    private double calculateTotalRouteDistance(double startLat, double startLng, List<Shop> shops, double endLat, double endLng) {
        double totalDist = 0.0;
        double curLat = startLat;
        double curLng = startLng;

        for (Shop s : shops) {
            if (s.getLatitude() != null && s.getLongitude() != null) {
                totalDist += calculateRoadDistance(curLat, curLng, s.getLatitude().doubleValue(), s.getLongitude().doubleValue());
                curLat = s.getLatitude().doubleValue();
                curLng = s.getLongitude().doubleValue();
            }
        }
        totalDist += calculateRoadDistance(curLat, curLng, endLat, endLng);
        return totalDist;
    }

    /**
     * Road Distance computation with Haversine + road winding coefficient ~1.28
     */
    public double calculateRoadDistance(double lat1, double lon1, double lat2, double lon2) {
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
        // Apply city road detour coefficient (approx 1.25 - 1.30 for urban/semi-urban routes)
        return Math.round((straightKm * 1.26) * 100.0) / 100.0;
    }

    private List<List<Double>> generateRoutePolylineWaypoints(double startLat, double startLng, List<Shop> shops, double endLat, double endLng) {
        List<List<Double>> waypoints = new ArrayList<>();
        waypoints.add(List.of(startLng, startLat));

        for (Shop s : shops) {
            if (s.getLatitude() != null && s.getLongitude() != null) {
                waypoints.add(List.of(s.getLongitude().doubleValue(), s.getLatitude().doubleValue()));
            }
        }
        waypoints.add(List.of(endLng, endLat));
        return waypoints;
    }

    private RouteWaypointDto mapShopToWaypoint(Shop s, int order, double distFromPrev, int estMins) {
        return RouteWaypointDto.builder()
                .shopId(s.getId())
                .shopCode(s.getShopCode())
                .shopName(s.getName())
                .ownerName(s.getOwnerName())
                .phone(s.getPhone())
                .address(s.getAddress())
                .areaName(s.getAreaName())
                .visitOrder(order)
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .distanceFromPrevKm(Math.round(distFromPrev * 10.0) / 10.0)
                .estimatedMinutesFromPrev(estMins)
                .build();
    }

    private String formatDurationHoursMinutes(int minutes) {
        int hours = minutes / 60;
        int remMin = minutes % 60;
        if (hours > 0) {
            return String.format("%dh %02dm", hours, remMin);
        }
        return String.format("%d mins", remMin);
    }
}
