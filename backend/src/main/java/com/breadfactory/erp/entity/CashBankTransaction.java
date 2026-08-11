package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.enums.CashTransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "cash_bank_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashBankTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_number", nullable = false, unique = true, length = 50)
    private String transactionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private CashBankType accountType;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private CashTransactionType transactionType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "running_cash_balance", precision = 12, scale = 2)
    private BigDecimal runningCashBalance;

    @Column(name = "running_bank_balance", precision = 12, scale = 2)
    private BigDecimal runningBankBalance;

    @Builder.Default
    @Column(name = "reconciliation_status", length = 30)
    private String reconciliationStatus = "RECONCILED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
