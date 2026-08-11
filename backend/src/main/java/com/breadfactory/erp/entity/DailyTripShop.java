package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.ShopVisitStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.ZonedDateTime;

/**
 * Represents a single shop visit within a DailyTripPlan.
 * Stores a snapshot of shop data at plan time so the historical record
 * is preserved even if the master Shop entity changes later.
 */
@Entity
@Table(name = "daily_trip_shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTripShop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_trip_plan_id", nullable = false)
    private DailyTripPlan dailyTripPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    // Snapshot fields – preserved even if master Shop changes
    @Column(name = "shop_name", length = 150)
    private String shopName;

    @Column(name = "owner_name", length = 100)
    private String ownerName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "visit_sequence", nullable = false)
    private Integer visitSequence;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_status", nullable = false, length = 30)
    @Builder.Default
    private ShopVisitStatus visitStatus = ShopVisitStatus.PENDING;

    @Column(name = "expected_visit_time")
    private LocalTime expectedVisitTime;

    @Column(name = "actual_arrival_time")
    private ZonedDateTime actualArrivalTime;

    @Column(name = "actual_departure_time")
    private ZonedDateTime actualDepartureTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "order_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal orderAmount = BigDecimal.ZERO;

    @Column(name = "payment_collected", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal paymentCollected = BigDecimal.ZERO;

    @Column(name = "distance_from_prev_km")
    private Double distanceFromPrevKm;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
