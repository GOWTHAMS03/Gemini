package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.CashBankType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashTransferRequest {

    @NotNull(message = "Source account is required")
    private CashBankType fromAccount; // CASH or BANK

    @NotNull(message = "Destination account is required")
    private CashBankType toAccount; // BANK or CASH

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "0.01", message = "Transfer amount must be greater than 0")
    private BigDecimal amount;

    private String referenceNumber;
    private String notes;
}
