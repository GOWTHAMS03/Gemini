package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReturnResponse {
    private Long id;
    private String returnNumber;
    private Long originalInvoiceId;
    private String originalInvoiceNumber;
    private Long shopId;
    private String shopName;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalReturnAmount;
    private String reason;
    private ZonedDateTime returnDate;
    private String creditNoteNumber;
    private List<ReturnItemResponse> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReturnItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private Integer returnedQuantity;
        private BigDecimal originalUnitPrice;
        private BigDecimal totalCreditAmount;
    }
}
