package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

/**
 * Represents products loaded into a trip/vehicle.
 * Tracks inventory movement through the complete trip lifecycle.
 */
@Entity
@Table(name = "trip_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // ─── Inventory Tracking ──────────────────────────────────────────────
    @Column(name = "loaded_quantity", nullable = false)
    private Integer loadedQuantity;

    @Builder.Default
    @Column(name = "available_quantity")
    private Integer availableQuantity = 0;  // loaded - sold

    @Builder.Default
    @Column(name = "sold_quantity")
    private Integer soldQuantity = 0;

    @Builder.Default
    @Column(name = "returned_quantity")
    private Integer returnedQuantity = 0;

    @Builder.Default
    @Column(name = "damaged_quantity")
    private Integer damagedQuantity = 0;

    // ─── Reconciliation ──────────────────────────────────────────────
    @Column(name = "remaining_quantity")
    private Integer remainingQuantity;  // For tracking unaccounted stock

    @Column(name = "is_reconciled")
    @Builder.Default
    private Boolean isReconciled = false;

    // ─── Financial Tracking ──────────────────────────────────────────────
    @Column(name = "total_sale_amount", precision = 12, scale = 2)
    private BigDecimal totalSaleAmount;

    @Column(name = "total_returned_amount", precision = 12, scale = 2)
    private BigDecimal totalReturnedAmount;

    // ─── Audit Trail ──────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
