package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.WeeklyTripPlan;
import com.breadfactory.erp.enums.WeeklyPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyTripPlanRepository extends JpaRepository<WeeklyTripPlan, Long> {

    Optional<WeeklyTripPlan> findByPlanNumber(String planNumber);

    List<WeeklyTripPlan> findByDispatchGroupId(Long dispatchGroupId);

    List<WeeklyTripPlan> findByDispatchGroupIdAndStatus(Long dispatchGroupId, WeeklyPlanStatus status);

    List<WeeklyTripPlan> findByStatus(WeeklyPlanStatus status);

    @Query("SELECT w FROM WeeklyTripPlan w WHERE w.weekStartDate <= :date AND w.weekEndDate >= :date")
    List<WeeklyTripPlan> findByDateInRange(@Param("date") LocalDate date);

    @Query("SELECT w FROM WeeklyTripPlan w WHERE w.dispatchGroup.id = :groupId AND " +
           "((w.weekStartDate <= :endDate AND w.weekEndDate >= :startDate)) AND " +
           "w.status <> com.breadfactory.erp.enums.WeeklyPlanStatus.CANCELLED")
    List<WeeklyTripPlan> findOverlappingPlans(
            @Param("groupId") Long groupId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    List<WeeklyTripPlan> findByStatusOrderByWeekStartDateDesc(WeeklyPlanStatus status);

    @Query("SELECT w FROM WeeklyTripPlan w ORDER BY w.createdAt DESC")
    List<WeeklyTripPlan> findAllOrderByCreatedAtDesc();
}
