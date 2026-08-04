package com.breadfactory.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionPlanRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Planned quantity is required")
    @Min(value = 1, message = "Planned quantity must be at least 1")
    private Integer plannedQuantity;

    private String machineUsed;
    private Long operatorId;
}
