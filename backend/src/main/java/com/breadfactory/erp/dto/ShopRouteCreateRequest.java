package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopRouteCreateRequest {

    @NotNull(message = "Shop ID is required")
    private Long shopId;

    @NotNull(message = "Visit day is required (0=Monday, 1=Tuesday, ..., 6=Sunday)")
    private Integer visitDay;

    @NotNull(message = "Visit sequence is required")
    private Integer visitSequence;

    private LocalTime expectedVisitTime;

    @Builder.Default
    private Boolean isActive = true;
}
