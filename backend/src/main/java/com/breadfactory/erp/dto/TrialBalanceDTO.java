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
public class TrialBalanceDTO {
    private LocalDate asOfDate;
    private List<TrialBalanceItem> accounts;
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private boolean isBalanced;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrialBalanceItem {
        private String accountCode;
        private String accountName;
        private String accountType; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
        private BigDecimal debitBalance;
        private BigDecimal creditBalance;
    }
}
