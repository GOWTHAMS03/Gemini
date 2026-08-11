package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionKpisResponse {
    private Integer totalRunsToday;
    private Integer activeBatches;
    private Integer completedBatches;
    private Integer plannedOutputTotal;
    private Integer actualOutputTotal;
    private BigDecimal averageYieldPercentage;
    private Integer totalRejectedLoaves;
    private Integer totalWasteKg;
    private BigDecimal oeeEfficiencyPercentage;
    private BigDecimal totalMaterialCost;
}
