package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseReturnCreateRequest {

    @NotNull
    private Long purchaseInvoiceId;

    @NotNull
    private Long supplierId;

    private String reason;

    @NotNull
    private List<PurchaseReturnItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PurchaseReturnItemRequest {
        @NotNull
        private Long purchaseInvoiceItemId;

        @NotNull
        private Long rawMaterialId;

        @NotNull
        private BigDecimal returnedQuantity;
    }
}
