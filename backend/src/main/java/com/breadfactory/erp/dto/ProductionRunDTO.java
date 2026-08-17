package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ProductionShift;
import com.breadfactory.erp.enums.ProductionStage;
import com.breadfactory.erp.enums.ProductionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionRunDTO {
    private Long id;
    private String runNumber;
    private String batchNumber;
    
    // Product details
    private Long productId;
    private String productCode;
    private String productName;
    private String productCategory;
    private Integer shelfLifeDays;
    
    // Recipe details
    private Long recipeId;
    private String recipeName;
    
    // Output quantities
    private Integer plannedQuantity;
    private Integer actualProducedQuantity;
    private Integer rejectedQuantity;
    private Integer wasteQuantity;
    private BigDecimal yieldPercentage;
    
    // Production state
    private ProductionStatus status;
    private ProductionStage currentStage;
    private ProductionShift shift;
    private String machineUsed;
    
    // Operator
    private Long operatorId;
    private String operatorName;
    
    // Process parameters
    private BigDecimal targetDoughWeightKg;
    private BigDecimal actualDoughWeightKg;
    private Integer bakingTempCelsius;
    private Integer bakingTimeMinutes;
    
    // Quality & QC
    private String defectReason;
    private String defectNotes;
    private String qcInspectorName;
    private Boolean isQcPassed;
    
    // Financials
    private BigDecimal unitCost;
    private BigDecimal totalProductionCost;
    private String notes;
    
    // 3-Stage Start & Stop Timestamps
    private ZonedDateTime stage1StartTime;
    private ZonedDateTime stage1EndTime;
    private Boolean stage1Completed;

    private ZonedDateTime stage2StartTime;
    private ZonedDateTime stage2EndTime;
    private Boolean stage2Completed;

    private ZonedDateTime stage3StartTime;
    private ZonedDateTime stage3EndTime;
    private Boolean stage3Completed;

    // Stage 3 Packaging Module details
    private Integer boxCount;
    private Integer unitsPerBox;
    private Integer bundleCount;
    private Integer unitsPerBundle;
    private Integer coverCount;
    private Integer unitsPerCover;
    private Integer tinCount;
    private Integer looseUnits;
    private String packagingType;
    private String packagingNotes;
    
    // Timestamps
    private ZonedDateTime startTime;
    private ZonedDateTime endTime;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    
    // BOM Recipe details
    private List<BOMItemDTO> bomItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BOMItemDTO {
        private Long rawMaterialId;
        private String materialCode;
        private String materialName;
        private BigDecimal requiredQuantity;
        private String unit;
        private BigDecimal availableStock;
        private Boolean isSufficient;
        private BigDecimal unitCost;
        private BigDecimal totalCost;
    }
}
