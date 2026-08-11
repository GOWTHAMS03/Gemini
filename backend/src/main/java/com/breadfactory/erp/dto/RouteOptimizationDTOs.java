package com.breadfactory.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class RouteOptimizationDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteWaypointDto {
        private Long shopId;
        private String shopCode;
        private String shopName;
        private String ownerName;
        private String phone;
        private String address;
        private String areaName;
        private Integer visitOrder;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Double distanceFromPrevKm;
        private Integer estimatedMinutesFromPrev;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteOptimizationRequest {
        private List<Long> shopIds;
        private BigDecimal startLatitude;
        private BigDecimal startLongitude;
        private String startLocationName;
        private BigDecimal endLatitude;
        private BigDecimal endLongitude;
        private String endLocationName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteOptimizationPreviewResponse {
        private Long routeId;
        private String routeCode;
        private String routeName;
        private Double currentDistanceKm;
        private Double optimizedDistanceKm;
        private Double distanceSavedKm;
        private Double percentageSaved;
        private Integer estimatedDurationMinutes;
        private List<RouteWaypointDto> currentOrder;
        private List<RouteWaypointDto> suggestedOrder;
        private List<List<Double>> geometryGeojson; // [[lng, lat], ...]
        private String encodedPolyline;
        private String explanation;
        private List<RouteWaypointDto> missingLocationShops;
        private Boolean hasMissingLocations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteMapResponse {
        private Long routeId;
        private String routeCode;
        private String routeName;
        private String startingHub;
        private BigDecimal startLatitude;
        private BigDecimal startLongitude;
        private String startLocationName;
        private BigDecimal endLatitude;
        private BigDecimal endLongitude;
        private String endLocationName;
        private Double totalDistanceKm;
        private Integer estimatedDurationMinutes;
        private Boolean isOutdated;
        private List<RouteWaypointDto> shops;
        private List<List<Double>> geometryGeojson;
        private String encodedPolyline;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProximityVerificationRequest {
        private Double driverLatitude;
        private Double driverLongitude;
        private Double radiusMeters; // default 50 meters
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProximityVerificationResponse {
        private Long shopId;
        private String shopName;
        private Double distanceMeters;
        private Boolean isWithinRadius;
        private String status; // "AT_SHOP", "IN_TRANSIT"
        private String message;
    }
}
