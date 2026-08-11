package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.DailyTripStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single day's route and shops within a Weekly Trip Plan.
 */
@Entity
@Table(name = "daily_trip_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTripPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weekly_trip_plan_id", nullable = false)
    private WeeklyTripPlan weeklyTripPlan;

    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;

    @Column(name = "day_of_week", nullable = false, length = 20)
    private String dayOfWeek; // MONDAY, TUESDAY, etc.

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "route_name", length = 100)
    private String routeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DailyTripStatus status = DailyTripStatus.PLANNED;

    @Column(name = "total_shops")
    @Builder.Default
    private Integer totalShops = 0;

    @Column(name = "total_distance_km")
    @Builder.Default
    private Double totalDistanceKm = 0.0;

    @Column(name = "estimated_duration", length = 50)
    private String estimatedDuration;

    @Column(name = "start_time")
    private ZonedDateTime startTime;

    @Column(name = "completion_time")
    private ZonedDateTime completionTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "dailyTripPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("visitSequence ASC")
    @Builder.Default
    private List<DailyTripShop> shops = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
