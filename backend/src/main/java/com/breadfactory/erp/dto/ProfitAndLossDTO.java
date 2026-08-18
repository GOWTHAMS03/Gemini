package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitAndLossDTO {
    private LocalDate startDate;
    private LocalDate endDate;

    private BigDecimal grossSales;
    private BigDecimal salesReturns;
    private BigDecimal customerDiscounts;
    private BigDecimal netSalesRevenue;

    private BigDecimal costOfGoodsSold; // Direct Raw Materials / Recipe BOM
    private BigDecimal grossProfit;
    private BigDecimal grossProfitMarginPct;

    private BigDecimal totalOperatingExpenses;
    private Map<String, BigDecimal> expenseBreakdown;

    private BigDecimal operatingProfit; // EBIT
    private BigDecimal operatingProfitMarginPct;

    private BigDecimal netProfitBeforeTax;
    private BigDecimal estimatedTax;
    private BigDecimal netProfit;
    private BigDecimal netProfitMarginPct;
}
