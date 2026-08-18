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
public class CashFlowDTO {
    private LocalDate startDate;
    private LocalDate endDate;

    // Operating Cash Flows
    private BigDecimal cashFromSalesInvoices;
    private BigDecimal cashFromCustomerDebtors;
    private BigDecimal totalOperatingCashInflow;

    private BigDecimal cashPaidForRawMaterials;
    private BigDecimal cashPaidForExpensesAndSalaries;
    private BigDecimal cashPaidForGst;
    private BigDecimal totalOperatingCashOutflow;

    private BigDecimal netOperatingCashFlow;

    // Opening & Closing Treasury Positions
    private BigDecimal openingCashAndBank;
    private BigDecimal closingCashAndBank;
    private BigDecimal netTreasuryChange;
}
