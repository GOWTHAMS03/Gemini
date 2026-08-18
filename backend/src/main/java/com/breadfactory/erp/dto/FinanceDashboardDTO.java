package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceDashboardDTO {
    private String selectedPeriod; // TODAY, THIS_WEEK, MTD, ALL_TIME
    private BigDecimal periodSalesRevenue;
    private BigDecimal periodPurchasesAmount;
    private BigDecimal todaySalesRevenue;
    private BigDecimal todayPurchasesAmount;
    private BigDecimal currentCashBalance;
    private BigDecimal currentBankBalance;
    private BigDecimal totalCustomerOutstanding;
    private BigDecimal totalSupplierOutstanding;
    private BigDecimal monthlyRevenue;
    private BigDecimal monthlyExpenses;
    private BigDecimal grossProfit;
    private BigDecimal netProfit;
    private BigDecimal workingCapital;
    private BigDecimal grossProfitMarginPct;
    private BigDecimal netProfitMarginPct;
    private Map<String, BigDecimal> expensesByCategory;
    private List<RecentFinancialTransactionDTO> recentTransactions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentFinancialTransactionDTO {
        private String type; // SALES_INVOICE, PURCHASE_INVOICE, EXPENSE, CUSTOMER_PAYMENT, SUPPLIER_PAYMENT, CONTRA_TRANSFER
        private String referenceNumber;
        private String partyName;
        private BigDecimal amount;
        private String date;
    }
}
