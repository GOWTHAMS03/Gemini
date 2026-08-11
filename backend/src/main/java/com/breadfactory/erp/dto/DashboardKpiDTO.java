package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardKpiDTO {
    private Long todayProductionUnits;
    private BigDecimal todaySalesRevenue;
    private Long activeDispatchesCount;
    private Long completedDeliveriesCount;
    private Long totalVehiclesCount;
    private BigDecimal totalPendingPayments;
    private Long lowStockAlertsCount;
    private String lowStockItemsDescription;
    private Long expiringBatchesCount;
    private Double productionEfficiencyPercentage;
    private Double productionChangePercentage;
    private Double salesChangePercentage;
    private Double fleetDispatchPercentage;
}
