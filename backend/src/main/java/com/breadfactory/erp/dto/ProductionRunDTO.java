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
