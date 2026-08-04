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
    private BigDecimal totalPendingPayments;
    private Long lowStockAlertsCount;
    private Long expiringBatchesCount;
    private Double productionEfficiencyPercentage;
}
