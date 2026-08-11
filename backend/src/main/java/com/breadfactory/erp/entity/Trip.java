package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.TripStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Complete trip record with full dispatch and route management.
 * Tracks: Warehouse → Trip Loading → Vehicle/Trip Inventory → Route → Shop Visits → Sales → Billing → Payment → Returns/Damaged Stock → Trip Completion
 */
@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_number", nullable = false, unique = true, length = 50)
    private String tripNumber;

    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;

    // ─── Dispatch Assignment ──────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_group_id")
    private DispatchGroup dispatchGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_person_id")
    private User salesPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // ─── Route Assignment ──────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_group_id")
    private RouteGroup routeGroup;

    @Column(name = "route_name", nullable = false, length = 100)
    private String routeName;

    // ─── Trip Status & Lifecycle ──────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TripStatus status = TripStatus.DRAFT;

    @Column(name = "dispatch_time")
    private ZonedDateTime dispatchTime;

    @Column(name = "start_time")
    private ZonedDateTime startTime;

    @Column(name = "return_time")
    private ZonedDateTime returnTime;

    @Column(name = "completion_time")
    private ZonedDateTime completionTime;

    // ─── Inventory & Shop Details ──────────────────────────────────────────────
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TripItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TripShopVisit> shopVisits = new ArrayList<>();

    // ─── Inventory Reconciliation ──────────────────────────────────────────────
    @Column(name = "total_loaded_quantity")
    @Builder.Default
    private Integer totalLoadedQuantity = 0;

    @Column(name = "total_sold_quantity")
    @Builder.Default
    private Integer totalSoldQuantity = 0;

    @Column(name = "total_returned_quantity")
    @Builder.Default
    private Integer totalReturnedQuantity = 0;

    @Column(name = "total_damaged_quantity")
    @Builder.Default
    private Integer totalDamagedQuantity = 0;

    @Column(name = "reconciliation_notes", columnDefinition = "TEXT")
    private String reconciliationNotes;

    @Column(name = "is_reconciled")
    @Builder.Default
    private Boolean isReconciled = false;

    // ─── Trip Beta & Expenses ─────────────────────────────────────────────
    @Column(name = "beta_amount", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal betaAmount = java.math.BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "beta_payment_status", length = 30)
    @Builder.Default
    private com.breadfactory.erp.enums.PaymentStatus betaPaymentStatus = com.breadfactory.erp.enums.PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "beta_payment_mode", length = 30)
    private com.breadfactory.erp.enums.PaymentMode betaPaymentMode;

    @Column(name = "beta_paid_date")
    private ZonedDateTime betaPaidDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beta_expense_id")
    private Expense betaExpense;

    @Column(name = "beta_notes", columnDefinition = "TEXT")
    private String betaNotes;

    @Column(name = "other_trip_expenses", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal otherTripExpenses = java.math.BigDecimal.ZERO;

    @Column(name = "other_expenses_notes", columnDefinition = "TEXT")
    private String otherExpensesNotes;

    // ─── Sales & Financial Collection Tracking ────────────────────────────
    @Column(name = "total_sales_amount", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal totalSalesAmount = java.math.BigDecimal.ZERO;

    @Column(name = "cash_collected", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal cashCollected = java.math.BigDecimal.ZERO;

    @Column(name = "upi_collected", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal upiCollected = java.math.BigDecimal.ZERO;

    @Column(name = "total_collected", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal totalCollected = java.math.BigDecimal.ZERO;

    @Column(name = "collection_variance", precision = 12, scale = 2)
    @Builder.Default
    private java.math.BigDecimal collectionVariance = java.math.BigDecimal.ZERO;

    @Column(name = "inventory_variance")
    @Builder.Default
    private Integer inventoryVariance = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_status", length = 30)
    @Builder.Default
    private com.breadfactory.erp.enums.SettlementStatus settlementStatus = com.breadfactory.erp.enums.SettlementStatus.PENDING;

    // ─── EOD Settlement ───────────────────────────────────────────────────
    @Column(name = "eod_completed")
    @Builder.Default
    private Boolean eodCompleted = false;

    @Column(name = "eod_submitted_at")
    private ZonedDateTime eodSubmittedAt;

    @Column(name = "eod_notes", columnDefinition = "TEXT")
    private String eodNotes;

    @Column(name = "settled_by", length = 100)
    private String settledBy;

    // ─── Audit Trail ──────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
