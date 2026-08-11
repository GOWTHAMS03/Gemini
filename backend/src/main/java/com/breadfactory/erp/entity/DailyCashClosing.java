package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "daily_cash_closings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCashClosing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "closing_date", nullable = false, unique = true)
    private LocalDate closingDate;

    @Column(name = "opening_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingBalance;

    @Column(name = "total_cash_in", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCashIn;

    @Column(name = "total_cash_out", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCashOut;

    @Column(name = "expected_cash_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedCashBalance;

    @Column(name = "actual_cash_counted", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualCashCounted;

    @Builder.Default
    @Column(name = "discrepancy_amount", precision = 12, scale = 2)
    private BigDecimal discrepancyAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by_user_id")
    private User closedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
