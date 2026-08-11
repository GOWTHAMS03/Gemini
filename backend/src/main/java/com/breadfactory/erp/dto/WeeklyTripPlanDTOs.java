package com.breadfactory.erp.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class WeeklyTripPlanDTOs {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class WeeklyPlanCreateRequest {
        private Long dispatchGroupId;
        @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate weekStartDate;
        @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate weekEndDate;
        private String notes;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class WeeklyPlanResponse {
        private Long id;
        private String planNumber;
        private Long dispatchGroupId;
        private String dispatchGroupName;
        private LocalDate weekStartDate;
        private LocalDate weekEndDate;
        private Integer weekNumber;
        private Integer year;
        private String status;
        private Integer totalShops;
        private Double totalDistanceKm;
        private String notes;
        private String publishedAt;
        private String publishedBy;
        private String createdAt;
        // Dispatch Group info
        private List<MemberInfo> salesPersons;
        private MemberInfo driver;
        private VehicleInfo vehicle;
        // Daily breakdown
        private List<DailyTripResponse> dailyTrips;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MemberInfo {
        private Long id;
        private String fullName;
        private String phone;
        private String role;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VehicleInfo {
        private Long id;
        private String registrationNumber;
        private String vehicleType;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DailyTripResponse {
        private Long id;
        private LocalDate tripDate;
        private String dayOfWeek;
        private Long routeId;
        private String routeName;
        private String status;
        private Integer totalShops;
        private Double totalDistanceKm;
        private String estimatedDuration;
        private String startTime;
        private String completionTime;
        private String notes;
        private List<DailyShopResponse> shops;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DailyShopResponse {
        private Long id;
        private Long shopId;
        private String shopName;
        private String ownerName;
        private String phone;
        private String address;
        private Double latitude;
        private Double longitude;
        private Integer visitSequence;
        private String visitStatus;
        private String expectedVisitTime;
        private String actualArrivalTime;
        private String actualDepartureTime;
        private String notes;
        private Double orderAmount;
        private Double paymentCollected;
        private Double distanceFromPrevKm;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AssignRouteRequest {
        private Long routeId;
        private List<Long> shopIds; // optional custom selection
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateShopsRequest {
        private List<ShopSequenceItem> shops;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ShopSequenceItem {
        private Long shopId;
        private Integer visitSequence;
        private String expectedVisitTime;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateShopVisitStatusRequest {
        private String visitStatus;
        private String notes;
        private Double orderAmount;
        private Double paymentCollected;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NotificationResponse {
        private Long id;
        private String title;
        private String message;
        private String notificationType;
        private Long referenceId;
        private Boolean isRead;
        private String createdAt;
    }
}
