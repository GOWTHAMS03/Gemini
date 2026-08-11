package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalTime;
import java.time.ZonedDateTime;

/**
 * Represents a shop's assignment to a route with visit scheduling details.
 * Each shop can be visited on specific days in a specific sequence.
 */
@Entity
@Table(
    name = "shop_routes",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {"route_group_id", "shop_id", "visit_day"},
            name = "uk_route_shop_day"
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_group_id", nullable = false)
    private RouteGroup routeGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    /**
     * Visit day of week (0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday)
     */
    @Column(name = "visit_day", nullable = false)
    private Integer visitDay;

    /**
     * Sequence number for visiting shops on the same day
     * Lower number = visited earlier in the day
     */
    @Column(name = "visit_sequence", nullable = false)
    private Integer visitSequence;

    @Column(name = "expected_visit_time")
    private LocalTime expectedVisitTime;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
