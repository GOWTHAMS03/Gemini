package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripDashboardDTO {

    // Summary statistics
    private Long todayTripsCount;
    private Long upcomingTripsCount;
    private Long draftTripsCount;
    private Long dispatchedTripsCount;
    private Long activeTripsCount;
    private Long completedTripsCount;
    private Long cancelledTripsCount;

    // Financial summary
    private BigDecimal totalSalesAmount;
    private BigDecimal totalPaymentsCollected;
    private BigDecimal totalPendingAmount;

    // Inventory summary
    private Integer totalProductsLoaded;
    private Integer totalProductsSold;
    private Integer totalProductsReturned;
    private Integer totalProductsDamaged;

    // Trip details list
    private List<TripDashboardItemDTO> trips;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripDashboardItemDTO {
        private Long id;
        private String tripNumber;
        private LocalDate tripDate;
        private String driverName;
        private String salesPersonName;
        private String vehicleNumber;
        private String routeName;
        private String status;
        private Integer numberOfShops;
        private Integer completedVisits;
        private Integer totalLoadedQuantity;
        private Integer totalSoldQuantity;
        private Integer totalReturnedQuantity;
        private Integer totalDamagedQuantity;
        private BigDecimal totalSalesAmount;
        private BigDecimal totalPaymentCollected;
    }
}
