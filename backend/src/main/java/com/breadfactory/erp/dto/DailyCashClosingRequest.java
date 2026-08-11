package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCashClosingRequest {

    @NotNull
    private LocalDate closingDate;

    @NotNull
    private BigDecimal actualCashCounted;

    private String notes;
}
