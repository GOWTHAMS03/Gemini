package com.breadfactory.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReturnCreateRequest {

    @NotNull
    private Long originalInvoiceId;

    @NotNull
    private Long shopId;

    private Long driverId;

    private Long tripId;

    private String reason;

    @NotNull
    private List<ReturnItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReturnItemRequest {
        @NotNull
        private Long originalInvoiceItemId;

        @NotNull
        private Long productId;

        @NotNull
        private Integer returnedQuantity;
    }
}
