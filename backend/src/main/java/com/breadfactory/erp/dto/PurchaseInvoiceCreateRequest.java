package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseInvoiceCreateRequest {

    @NotNull
    private Long supplierId;

    private LocalDate dueDate;

    private BigDecimal discountAmount;
    private BigDecimal freightCharges;
    private BigDecimal additionalCharges;

    @NotNull
    private PaymentMode paymentMode;

    private BigDecimal initialPaidAmount;
    private String notes;

    @NotNull
    private List<PurchaseItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PurchaseItemRequest {
        @NotNull
        private Long rawMaterialId;

        @NotNull
        private BigDecimal quantity;

        @NotNull
        private BigDecimal unitCost;
    }
}
