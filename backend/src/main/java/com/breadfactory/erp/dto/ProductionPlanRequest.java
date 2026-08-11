package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ProductionShift;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionPlanRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private Long recipeId;

    @NotNull(message = "Planned quantity is required")
    @Min(value = 1, message = "Planned quantity must be at least 1")
    private Integer plannedQuantity;

    private String machineUsed;
    private Long operatorId;
    private ProductionShift shift;
    private BigDecimal targetDoughWeightKg;
    private Integer bakingTempCelsius;
    private Integer bakingTimeMinutes;
    private String notes;
}
