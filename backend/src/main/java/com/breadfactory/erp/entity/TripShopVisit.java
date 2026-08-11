package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.ShopVisitStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalTime;
import java.time.ZonedDateTime;

/**
 * Represents a scheduled shop visit within a trip.
 * Tracks the status and timing of each shop visit.
 */
@Entity
@Table(name = "trip_shop_visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripShopVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(name = "visit_sequence", nullable = false)
    private Integer visitSequence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ShopVisitStatus status = ShopVisitStatus.SCHEDULED;

    @Column(name = "expected_visit_time")
    private LocalTime expectedVisitTime;

    @Column(name = "actual_arrival_time")
    private ZonedDateTime actualArrivalTime;

    @Column(name = "actual_departure_time")
    private ZonedDateTime actualDepartureTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "products_qty", nullable = false)
    @Builder.Default
    private Integer productsQty = 0;

    @Column(name = "bill_amount")
    @Builder.Default
    private Double billAmount = 0.0;

    @Column(name = "collection_amount")
    @Builder.Default
    private Double collectionAmount = 0.0;

    @Column(name = "photo_proof_url", length = 500)
    private String photoProofUrl;

    @Column(name = "digital_signature_url", length = 500)
    private String digitalSignatureUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
