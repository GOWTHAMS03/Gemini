package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "delivery_acknowledgements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryAcknowledgement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id", nullable = false, unique = true)
    private Delivery delivery;

    @Column(name = "accepted_quantity", nullable = false)
    private Integer acceptedQuantity;

    @Builder.Default
    @Column(name = "damaged_quantity")
    private Integer damagedQuantity = 0;

    @Builder.Default
    @Column(name = "missing_quantity")
    private Integer missingQuantity = 0;

    @Column(name = "digital_signature_url", columnDefinition = "TEXT")
    private String digitalSignatureUrl;

    @Column(name = "photo_proof_url", columnDefinition = "TEXT")
    private String photoProofUrl;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_shop_user_id")
    private User verifiedByShopUser;

    @CreationTimestamp
    @Column(name = "acknowledged_at", updatable = false)
    private ZonedDateTime acknowledgedAt;
}
