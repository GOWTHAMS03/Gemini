package com.breadfactory.erp.entity;

import com.breadfactory.erp.enums.WeeklyPlanStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a Weekly Trip Plan for a Dispatch Group across Monday-Saturday.
 */
@Entity
@Table(name = "weekly_trip_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyTripPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_number", nullable = false, unique = true, length = 50)
    private String planNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_group_id", nullable = false)
    private DispatchGroup dispatchGroup;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "week_end_date", nullable = false)
    private LocalDate weekEndDate;

    @Column(name = "week_number")
    private Integer weekNumber;

    @Column(name = "year")
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private WeeklyPlanStatus status = WeeklyPlanStatus.DRAFT;

    @Column(name = "total_shops")
    @Builder.Default
    private Integer totalShops = 0;

    @Column(name = "total_distance_km")
    @Builder.Default
    private Double totalDistanceKm = 0.0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "published_at")
    private ZonedDateTime publishedAt;

    @Column(name = "published_by", length = 100)
    private String publishedBy;

    @OneToMany(mappedBy = "weeklyTripPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DailyTripPlan> dailyTrips = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
