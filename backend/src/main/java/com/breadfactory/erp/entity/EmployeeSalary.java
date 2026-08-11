package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

/**
 * Entity representing monthly salary configuration, processing, and disbursement for employees.
 * Every salary payment directly maps to a company expense, affecting cash/bank accounts and the general ledger.
 */
@Entity
@Table(
    name = "employee_salaries",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_employee_salary_month", columnNames = {"employee_id", "salary_month"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeSalary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(name = "salary_month", nullable = false, length = 7) // Format: "YYYY-MM" (e.g., "2026-08")
    private String salaryMonth;

    @Column(name = "basic_salary", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(name = "allowance_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal allowanceAmount = BigDecimal.ZERO;

    @Column(name = "deduction_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deductionAmount = BigDecimal.ZERO;

    @Column(name = "trip_beta_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tripBetaAmount = BigDecimal.ZERO;

    @Column(name = "other_expenses", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal otherExpenses = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 30)
    private PaymentMode paymentMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id")
    private Expense expense;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

    @Column(name = "paid_by", length = 100)
    private String paidBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
