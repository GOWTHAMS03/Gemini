package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitAndLossDTO {
    private BigDecimal grossSales;
    private BigDecimal salesReturns;
    private BigDecimal netSalesRevenue;
    private BigDecimal costOfGoodsSold;
    private BigDecimal grossProfit;
    private BigDecimal totalOperatingExpenses;
    private Map<String, BigDecimal> expenseBreakdown;
    private BigDecimal netProfitBeforeTax;
    private BigDecimal estimatedTax;
    private BigDecimal netProfit;
}
