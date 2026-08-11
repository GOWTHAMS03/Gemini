package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceSheetDTO {
    // Current Assets
    private BigDecimal cashOnHand;
    private BigDecimal bankBalance;
    private BigDecimal accountsReceivable;
    private BigDecimal rawMaterialInventoryValue;
    private BigDecimal finishedGoodsInventoryValue;
    private BigDecimal totalCurrentAssets;

    // Current Liabilities
    private BigDecimal accountsPayable;
    private BigDecimal gstPayable;
    private BigDecimal totalCurrentLiabilities;

    // Equity
    private BigDecimal retainedEarnings;
    private BigDecimal totalEquity;

    private BigDecimal totalAssets;
    private BigDecimal totalLiabilitiesAndEquity;
}
