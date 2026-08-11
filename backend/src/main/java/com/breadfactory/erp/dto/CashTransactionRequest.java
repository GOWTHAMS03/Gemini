package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.enums.CashTransactionType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashTransactionRequest {

    @NotNull
    private CashBankType accountType;

    @NotNull
    private CashTransactionType transactionType;

    @NotNull
    private BigDecimal amount;

    private String referenceType;
    private String referenceNumber;
    private String notes;
}
