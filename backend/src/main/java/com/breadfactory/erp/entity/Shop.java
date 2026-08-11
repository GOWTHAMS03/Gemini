package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shop_code", nullable = false, unique = true, length = 50)
    private String shopCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "owner_name", nullable = false, length = 150)
    private String ownerName;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 50)
    private String gstin;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "route_name", length = 100)
    private String routeName;

    @Builder.Default
    @Column(name = "credit_limit", precision = 12, scale = 2)
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "outstanding_amount", precision = 12, scale = 2)
    private BigDecimal outstandingAmount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @Builder.Default
    @Column(name = "location_accuracy", precision = 8, scale = 2)
    private BigDecimal locationAccuracy = BigDecimal.valueOf(5.0);

    @Column(name = "area_name", length = 150)
    private String areaName;

    @Builder.Default
    @Column(name = "customer_type", length = 30)
    private String customerType = "SHOP";

    @Builder.Default
    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.valueOf(8.00);

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "sales_executive_code", length = 50)
    private String salesExecutiveCode;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
