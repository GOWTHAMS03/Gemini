package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DailyTripPlan;
import com.breadfactory.erp.enums.DailyTripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyTripPlanRepository extends JpaRepository<DailyTripPlan, Long> {

    List<DailyTripPlan> findByWeeklyTripPlanId(Long weeklyPlanId);

    List<DailyTripPlan> findByWeeklyTripPlanIdOrderByTripDateAsc(Long weeklyPlanId);

    Optional<DailyTripPlan> findByWeeklyTripPlanIdAndDayOfWeek(Long weeklyPlanId, String dayOfWeek);

    List<DailyTripPlan> findByTripDate(LocalDate tripDate);

    List<DailyTripPlan> findByTripDateAndStatus(LocalDate tripDate, DailyTripStatus status);

    @Query("SELECT d FROM DailyTripPlan d JOIN d.weeklyTripPlan w JOIN w.dispatchGroup g " +
           "JOIN g.salesPersons sp WHERE sp.id = :userId AND d.tripDate = :date " +
           "AND w.status IN (com.breadfactory.erp.enums.WeeklyPlanStatus.PUBLISHED, com.breadfactory.erp.enums.WeeklyPlanStatus.IN_PROGRESS)")
    List<DailyTripPlan> findTodaysTripForSalesPerson(
            @Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT d FROM DailyTripPlan d JOIN d.weeklyTripPlan w JOIN w.dispatchGroup g " +
           "WHERE g.salesPerson.id = :userId AND d.tripDate = :date " +
           "AND w.status IN (com.breadfactory.erp.enums.WeeklyPlanStatus.PUBLISHED, com.breadfactory.erp.enums.WeeklyPlanStatus.IN_PROGRESS)")
    List<DailyTripPlan> findTodaysTripForLegacySalesPerson(
            @Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT d FROM DailyTripPlan d JOIN d.weeklyTripPlan w JOIN w.dispatchGroup g " +
           "WHERE g.driver.id = :userId AND d.tripDate = :date " +
           "AND w.status IN (com.breadfactory.erp.enums.WeeklyPlanStatus.PUBLISHED, com.breadfactory.erp.enums.WeeklyPlanStatus.IN_PROGRESS)")
    List<DailyTripPlan> findTodaysTripForDriver(
            @Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT d FROM DailyTripPlan d JOIN d.weeklyTripPlan w " +
           "WHERE w.id = :weeklyPlanId ORDER BY d.tripDate ASC")
    List<DailyTripPlan> findWeeklyTripsForPlan(@Param("weeklyPlanId") Long weeklyPlanId);
}
