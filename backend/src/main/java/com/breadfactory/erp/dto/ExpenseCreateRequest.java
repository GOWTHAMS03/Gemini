package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.ExpenseCategory;
import com.breadfactory.erp.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseCreateRequest {

    @NotNull
    private ExpenseCategory category;

    @NotNull
    private BigDecimal amount;

    private BigDecimal taxAmount;

    @NotNull
    private PaymentMode paymentMode;

    private String payeeName;

    @NotNull
    private LocalDate expenseDate;

    private String referenceNumber;
    private String description;
}
