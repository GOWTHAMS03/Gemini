package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstSummaryDTO {
    private LocalDate startDate;
    private LocalDate endDate;

    // Outward Supplies (Output GST on Sales)
    private BigDecimal totalTaxableSales;
    private BigDecimal totalOutputGst;
    private BigDecimal outputCgst;
    private BigDecimal outputSgst;

    // Inward Supplies (Input Tax Credit - ITC on Purchases)
    private BigDecimal totalTaxablePurchases;
    private BigDecimal totalInputTaxCredit;
    private BigDecimal inputCgst;
    private BigDecimal inputSgst;

    // Net GST Position
    private BigDecimal netGstPayable;
    private BigDecimal itcCarryForward;

    private List<GstTaxInvoiceItem> salesTaxInvoices;
    private List<GstTaxInvoiceItem> purchaseTaxInvoices;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GstTaxInvoiceItem {
        private String invoiceNumber;
        private String partyName;
        private String gstin;
        private String date;
        private BigDecimal taxableValue;
        private BigDecimal gstRate;
        private BigDecimal gstAmount;
        private String type; // B2B_SALES, B2B_PURCHASE
    }
}
