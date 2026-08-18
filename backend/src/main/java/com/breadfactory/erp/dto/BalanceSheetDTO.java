package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceSheetDTO {
    private LocalDate asOfDate;

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

    // Working Capital
    private BigDecimal workingCapital;

    // Equity
    private BigDecimal ownersCapital;
    private BigDecimal retainedEarnings;
    private BigDecimal totalEquity;

    private BigDecimal totalAssets;
    private BigDecimal totalLiabilitiesAndEquity;
    private boolean isBalanced;
}
