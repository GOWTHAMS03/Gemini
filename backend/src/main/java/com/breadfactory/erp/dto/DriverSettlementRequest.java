package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverSettlementRequest {

    @NotNull
    private Long tripId;

    @NotNull
    private Long driverId;

    @NotNull
    private BigDecimal cashCollected;

    @NotNull
    private BigDecimal upiCollected;

    @NotNull
    private BigDecimal chequeCollected;
}
