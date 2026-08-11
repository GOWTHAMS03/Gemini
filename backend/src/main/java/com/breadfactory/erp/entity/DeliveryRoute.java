package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "delivery_routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_code", nullable = false, unique = true, length = 50)
    private String routeCode;

    @Column(name = "route_name", nullable = false, length = 150)
    private String routeName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "starting_hub", length = 200)
    private String startingHub;

    @Builder.Default
    @Column(name = "start_latitude", precision = 10, scale = 8)
    private BigDecimal startLatitude = BigDecimal.valueOf(10.787252191240228);

    @Builder.Default
    @Column(name = "start_longitude", precision = 11, scale = 8)
    private BigDecimal startLongitude = BigDecimal.valueOf(79.57505803846621);

    @Builder.Default
    @Column(name = "start_location_name", length = 200)
    private String startLocationName = "Central Factory & Distribution Hub";

    @Builder.Default
    @Column(name = "end_latitude", precision = 10, scale = 8)
    private BigDecimal endLatitude = BigDecimal.valueOf(10.787252191240228);

    @Builder.Default
    @Column(name = "end_longitude", precision = 11, scale = 8)
    private BigDecimal endLongitude = BigDecimal.valueOf(79.57505803846621);

    @Builder.Default
    @Column(name = "end_location_name", length = 200)
    private String endLocationName = "Central Factory & Distribution Hub";

    @Column(name = "assigned_driver", length = 100)
    private String assignedDriver;

    @Column(name = "driver_phone", length = 30)
    private String driverPhone;

    @Column(name = "assigned_vehicle", length = 100)
    private String assignedVehicle;

    @Builder.Default
    @Column(name = "total_shops")
    private Integer totalShops = 0;

    @Builder.Default
    @Column(name = "total_distance_km")
    private Double totalDistanceKm = 0.0;

    @Builder.Default
    @Column(name = "distance_km")
    private Double distanceKm = 0.0;

    @Column(name = "dispatch_time", length = 30)
    private String dispatchTime;

    @Column(name = "estimated_duration", length = 30)
    private String estimatedDuration;

    @Builder.Default
    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes = 45;

    @Builder.Default
    @Column(name = "is_outdated")
    private Boolean isOutdated = false;

    @Column(name = "geometry_geojson", columnDefinition = "TEXT")
    private String geometryGeojson;

    @Column(name = "encoded_polyline", columnDefinition = "TEXT")
    private String encodedPolyline;

    @Builder.Default
    @Column(name = "optimized_order_applied")
    private Boolean optimizedOrderApplied = false;

    @Builder.Default
    @Column(length = 30)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, IN_TRANSIT, COMPLETED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("visitOrder ASC")
    @Builder.Default
    private List<RouteShop> routeShops = new ArrayList<>();
}
