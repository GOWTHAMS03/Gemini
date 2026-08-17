package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.ProductionShift;
import com.breadfactory.erp.enums.ProductionStage;
import com.breadfactory.erp.enums.ProductionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "production_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_number", nullable = false, unique = true, length = 50)
    private String runNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(name = "planned_quantity", nullable = false)
    private Integer plannedQuantity;

    @Builder.Default
    @Column(name = "actual_produced_quantity")
    private Integer actualProducedQuantity = 0;

    @Builder.Default
    @Column(name = "rejected_quantity")
    private Integer rejectedQuantity = 0;

    @Builder.Default
    @Column(name = "waste_quantity")
    private Integer wasteQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ProductionStatus status = ProductionStatus.PLANNED;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", length = 40)
    @Builder.Default
    private ProductionStage currentStage = ProductionStage.STAGE_DISPENSING;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift", length = 30)
    @Builder.Default
    private ProductionShift shift = ProductionShift.MORNING_SHIFT;

    @Column(name = "machine_used", length = 100)
    private String machineUsed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private User operator;

    @Column(name = "target_dough_weight_kg", precision = 10, scale = 2)
    private BigDecimal targetDoughWeightKg;

    @Column(name = "actual_dough_weight_kg", precision = 10, scale = 2)
    private BigDecimal actualDoughWeightKg;

    @Column(name = "baking_temp_celsius")
    private Integer bakingTempCelsius;

    @Column(name = "baking_time_minutes")
    private Integer bakingTimeMinutes;

    @Column(name = "yield_percentage", precision = 6, scale = 2)
    private BigDecimal yieldPercentage;

    @Column(name = "defect_reason", length = 150)
    private String defectReason;

    @Column(name = "defect_notes", length = 500)
    private String defectNotes;

    @Column(name = "qc_inspector_name", length = 100)
    private String qcInspectorName;

    @Builder.Default
    @Column(name = "is_qc_passed")
    private Boolean isQcPassed = false;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "total_production_cost", precision = 12, scale = 2)
    private BigDecimal totalProductionCost;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "start_time")
    private ZonedDateTime startTime;

    @Column(name = "end_time")
    private ZonedDateTime endTime;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    // ─── 3-Stage Start & Stop Timestamps ────────────────────────────────────

    @Column(name = "stage1_start_time")
    private ZonedDateTime stage1StartTime;

    @Column(name = "stage1_end_time")
    private ZonedDateTime stage1EndTime;

    @Builder.Default
    @Column(name = "stage1_completed")
    private Boolean stage1Completed = false;

    @Column(name = "stage2_start_time")
    private ZonedDateTime stage2StartTime;

    @Column(name = "stage2_end_time")
    private ZonedDateTime stage2EndTime;

    @Builder.Default
    @Column(name = "stage2_completed")
    private Boolean stage2Completed = false;

    @Column(name = "stage3_start_time")
    private ZonedDateTime stage3StartTime;

    @Column(name = "stage3_end_time")
    private ZonedDateTime stage3EndTime;

    @Builder.Default
    @Column(name = "stage3_completed")
    private Boolean stage3Completed = false;

    // ─── Stage 3: Packaging Module Management (Boxes & Bundles) ─────────────

    @Builder.Default
    @Column(name = "box_count")
    private Integer boxCount = 0;

    @Builder.Default
    @Column(name = "units_per_box")
    private Integer unitsPerBox = 24;

    @Builder.Default
    @Column(name = "bundle_count")
    private Integer bundleCount = 0;

    @Builder.Default
    @Column(name = "units_per_bundle")
    private Integer unitsPerBundle = 10;

    @Builder.Default
    @Column(name = "cover_count")
    private Integer coverCount = 0;

    @Builder.Default
    @Column(name = "units_per_cover")
    private Integer unitsPerCover = 63; // 63 packets per 1 cover (₹30 Rusk)

    @Builder.Default
    @Column(name = "tin_count")
    private Integer tinCount = 0; // 3kg Din / Tin Rusk

    @Builder.Default
    @Column(name = "loose_units")
    private Integer looseUnits = 0;

    @Column(name = "packaging_type", length = 50)
    private String packagingType; // "BOX", "BUNDLE", "COVER", "TIN_3KG", "MIXED"

    @Column(name = "packaging_notes", length = 500)
    private String packagingNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
