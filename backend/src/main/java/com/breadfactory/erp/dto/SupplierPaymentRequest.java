package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierPaymentRequest {

    @NotNull
    private Long supplierId;

    private Long purchaseInvoiceId;

    @NotNull
    private BigDecimal amount;

    @NotNull
    private PaymentMode paymentMode;

    private String referenceNumber;
    private String description;
}
