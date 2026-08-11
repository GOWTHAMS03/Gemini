package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.ExpiredDisposalStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

@Entity
@Table(name = "expired_product_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpiredProductTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_return_id")
    private SalesReturn salesReturn;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "original_unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal originalUnitPrice;

    @Column(name = "total_loss_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalLossValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "disposal_status", nullable = false, length = 50)
    @Builder.Default
    private ExpiredDisposalStatus disposalStatus = ExpiredDisposalStatus.COLLECTED_BY_DRIVER;

    @Column(name = "mfg_date")
    private LocalDate mfgDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
