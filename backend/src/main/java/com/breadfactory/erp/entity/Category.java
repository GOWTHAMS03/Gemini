package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String slug;
    private String hsnCode;
    private String gstRate;
    private Integer itemCount;
    private String color;
    private String status; // ACTIVE, INACTIVE

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "category_sub_categories", joinColumns = @JoinColumn(name = "category_id"))
    @Column(name = "sub_category_name")
    @Builder.Default
    private List<String> subCategories = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = ZonedDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
        if (this.itemCount == null) this.itemCount = 0;
    }
}
