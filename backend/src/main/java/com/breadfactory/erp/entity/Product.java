package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", nullable = false, unique = true, length = 50)
    private String productCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 100)
    private String barcode;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "weight_grams", precision = 8, scale = 2)
    private BigDecimal weightGrams;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Builder.Default
    @Column(name = "minimum_selling_price", precision = 10, scale = 2)
    private BigDecimal minimumSellingPrice = BigDecimal.valueOf(48.00);

    @Column(name = "dealer_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal dealerPrice;

    @Column(name = "wholesale_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal wholesalePrice;

    @Column(name = "retail_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal retailPrice;

    @Column(length = 50)
    private String category;

    @Column(name = "shelf_life_days", nullable = false)
    private Integer shelfLifeDays;

    @Builder.Default
    @Column(name = "expiry_alert_days")
    private Integer expiryAlertDays = 2;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
