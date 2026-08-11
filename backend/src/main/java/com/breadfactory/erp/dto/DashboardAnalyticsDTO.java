package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardAnalyticsDTO {

    private List<ProductionVelocityPoint> productionVelocity;
    private List<WeeklyRevenuePoint> weeklyRevenue;
    private List<MachineEfficiencyPoint> machineEfficiency;
    private List<RawMaterialThresholdPoint> rawMaterialStocks;
    private List<RouteCoverageSharePoint> routeCoverageShare;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductionVelocityPoint {
        private String time;
        private Long actual;
        private Long target;
        private BigDecimal sales;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklyRevenuePoint {
        private String day;
        private BigDecimal revenue;
        private BigDecimal target;
        private Long orderCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MachineEfficiencyPoint {
        private String name;
        private Long actualOutput;
        private Long targetOutput;
        private Double efficiency;
        private String color;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RawMaterialThresholdPoint {
        private String name;
        private BigDecimal currentStock;
        private BigDecimal minStock;
        private Double fillPercent;
        private Boolean isLow;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RouteCoverageSharePoint {
        private String name;
        private Double value;
        private Integer count;
        private Integer totalOutlets;
        private String color;
    }
}
