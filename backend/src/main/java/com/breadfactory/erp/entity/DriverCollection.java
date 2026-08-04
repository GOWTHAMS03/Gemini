package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.SettlementStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "driver_collections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "collection_code", nullable = false, unique = true, length = 50)
    private String collectionCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @Builder.Default
    @Column(name = "cash_collected", precision = 12, scale = 2)
    private BigDecimal cashCollected = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "upi_collected", precision = 12, scale = 2)
    private BigDecimal upiCollected = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cheque_collected", precision = 12, scale = 2)
    private BigDecimal chequeCollected = BigDecimal.ZERO;

    @Column(name = "expected_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedTotal;

    @Column(name = "actual_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualTotal;

    @Builder.Default
    @Column(name = "shortage_excess", precision = 12, scale = 2)
    private BigDecimal shortageExcess = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_status", length = 30)
    @Builder.Default
    private SettlementStatus settlementStatus = SettlementStatus.PENDING;

    @Column(name = "settled_at")
    private ZonedDateTime settledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
