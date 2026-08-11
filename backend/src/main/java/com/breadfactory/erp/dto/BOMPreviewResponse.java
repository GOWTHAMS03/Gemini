package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BOMPreviewResponse {
    private Long productId;
    private String productName;
    private Long recipeId;
    private String recipeName;
    private Integer requestedQuantity;
    private BigDecimal recipeBatchSize;
    private BigDecimal scalingRatio;
    private BigDecimal estimatedUnitCost;
    private BigDecimal estimatedTotalCost;
    private Boolean allIngredientsSufficient;
    private List<ProductionRunDTO.BOMItemDTO> ingredients;
}
