package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "loaded_quantity", nullable = false)
    private Integer loadedQuantity;

    @Builder.Default
    @Column(name = "sold_quantity")
    private Integer soldQuantity = 0;

    @Builder.Default
    @Column(name = "returned_quantity")
    private Integer returnedQuantity = 0;

    @Builder.Default
    @Column(name = "damaged_quantity")
    private Integer damagedQuantity = 0;
}
