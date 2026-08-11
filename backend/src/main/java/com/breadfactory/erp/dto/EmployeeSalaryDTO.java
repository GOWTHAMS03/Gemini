package com.breadfactory.erp.dto;

import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

public class EmployeeSalaryDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalaryResponse {
        private Long id;
        private Long employeeId;
        private String employeeName;
        private String employeeUsername;
        private String role;
        private String department;
        private String designation;
        private String salaryMonth;
        private BigDecimal basicSalary;
        private BigDecimal allowanceAmount;
        private BigDecimal deductionAmount;
        private BigDecimal tripBetaAmount;
        private BigDecimal otherExpenses;
        private BigDecimal netSalary;
        private PaymentStatus status;
        private LocalDate paymentDate;
        private PaymentMode paymentMode;
        private Long expenseId;
        private String expenseNumber;
        private String notes;
        private String processedBy;
        private String paidBy;
        private ZonedDateTime createdAt;
        private ZonedDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalaryCreateOrUpdateRequest {
        private Long employeeId;
        private String salaryMonth; // Format: "YYYY-MM"
        private BigDecimal basicSalary;
        private BigDecimal allowanceAmount;
        private BigDecimal deductionAmount;
        private BigDecimal tripBetaAmount;
        private BigDecimal otherExpenses;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcessMonthlySalaryRequest {
        private String salaryMonth; // Format: "YYYY-MM" (e.g. "2026-08")
        private String role; // optional filter (e.g., "DRIVER", "SALES_EXECUTIVE")
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalaryPaymentRequest {
        private PaymentMode paymentMode; // CASH, BANK_TRANSFER, UPI, CHEQUE
        private LocalDate paymentDate;
        private String referenceNumber;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeSalaryHistoryResponse {
        private Long employeeId;
        private String employeeName;
        private String role;
        private List<SalaryResponse> history;
        private BigDecimal totalPaidYtd;
        private BigDecimal totalPending;
    }
}
