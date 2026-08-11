package com.breadfactory.erp.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryExpenseDashboardDTO {

    // ─── Monthly Salary Summary ─────────────────────────────────────────────
    private String selectedMonth;
    private Integer totalEmployees;
    private Integer totalDrivers;
    private Integer totalSalesPersons;
    private Integer totalOtherStaff;

    private BigDecimal totalMonthlySalary;
    private BigDecimal totalSalaryPaid;
    private BigDecimal totalSalaryPending;
    private Integer paidEmployeesCount;
    private Integer pendingEmployeesCount;

    // ─── Trip Beta & Operational Allowance Summary ──────────────────────────
    private Integer totalTripsInMonth;
    private Integer totalBetaPaidTrips;
    private BigDecimal totalBetaAllocated;
    private BigDecimal totalBetaPaid;
    private BigDecimal totalBetaPending;
    private BigDecimal otherTripExpenses;

    // ─── Total Company Employee & Trip Expenses ─────────────────────────────
    private BigDecimal grandTotalEmployeeExpense; // Salary Paid + Beta Paid + Other Expenses
    private Map<String, BigDecimal> expenseBreakdownByCategory;

    // ─── Trend & Monthly Comparison ─────────────────────────────────────────
    private List<MonthlyExpenseTrendItem> monthlyTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyExpenseTrendItem {
        private String month;
        private BigDecimal salaryExpense;
        private BigDecimal betaExpense;
        private BigDecimal otherExpenses;
        private BigDecimal totalExpense;
    }
}
