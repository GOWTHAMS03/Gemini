package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceCreateRequest {

    private Long tripId;

    @NotNull
    private Long shopId;

    private Long driverId;

    @NotNull
    private PaymentMode paymentMode;

    private BigDecimal discountAmount;

    @NotNull
    private List<InvoiceItemRequest> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItemRequest {
        @NotNull
        private Long productId;

        @NotNull
        private Integer quantity;

        @NotNull
        private BigDecimal unitPrice;
    }
}
