package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ProductionStage;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionStageAdvanceRequest {

    @NotNull(message = "Target stage is required")
    private ProductionStage targetStage;

    private BigDecimal actualDoughWeightKg;
    private Integer bakingTempCelsius;
    private Integer bakingTimeMinutes;
    private String notes;
}
