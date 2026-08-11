package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    Optional<Trip> findByTripNumber(String tripNumber);

    List<Trip> findByDriverIdAndStatus(Long driverId, TripStatus status);

    List<Trip> findByStatus(TripStatus status);

    List<Trip> findBySalesPersonIdAndStatus(Long salesPersonId, TripStatus status);

    List<Trip> findByVehicleIdAndStatus(Long vehicleId, TripStatus status);

    List<Trip> findByDispatchGroupId(Long dispatchGroupId);

    List<Trip> findByDispatchGroupIdOrderByTripDateDesc(Long dispatchGroupId);

    List<Trip> findByRouteGroupId(Long routeGroupId);

    List<Trip> findByTripDate(LocalDate tripDate);

    List<Trip> findByStatusAndTripDate(TripStatus status, LocalDate tripDate);

    /**
     * Get active trips - those that are dispatched or in progress
     */
    @Query("SELECT t FROM Trip t WHERE t.status IN ('DISPATCHED', 'IN_PROGRESS') ORDER BY t.tripDate DESC")
    List<Trip> findActiveTrips();

    /**
     * Check if a driver has any active trips
     */
    @Query("SELECT COUNT(t) > 0 FROM Trip t WHERE t.driver.id = :driverId AND t.status IN ('DISPATCHED', 'IN_PROGRESS')")
    boolean hasActiveTrip(@Param("driverId") Long driverId);

    @Query("SELECT t FROM Trip t WHERE (t.driver.id = :userId OR t.salesPerson.id = :userId) AND t.status IN ('DISPATCHED', 'IN_PROGRESS', 'CONFIRMED', 'DRAFT') ORDER BY t.id DESC")
    List<Trip> findActiveTripsForUser(@Param("userId") Long userId);

    /**
     * Check if a vehicle has any active trips
     */
    @Query("SELECT COUNT(t) > 0 FROM Trip t WHERE t.vehicle.id = :vehicleId AND t.status IN ('DISPATCHED', 'IN_PROGRESS')")
    boolean hasActiveVehicleTrip(@Param("vehicleId") Long vehicleId);

    /**
     * Check if a sales person has any active trips
     */
    @Query("SELECT COUNT(t) > 0 FROM Trip t WHERE t.salesPerson.id = :salesPersonId AND t.status IN ('DISPATCHED', 'IN_PROGRESS')")
    boolean hasSalesPersonActiveTrip(@Param("salesPersonId") Long salesPersonId);

    /**
     * Get trips for a specific date range
     */
    @Query("SELECT t FROM Trip t WHERE t.tripDate BETWEEN :startDate AND :endDate ORDER BY t.tripDate DESC")
    List<Trip> findTripsBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * Get all trips that need reconciliation
     */
    @Query("SELECT t FROM Trip t WHERE t.status = 'COMPLETED' AND t.isReconciled = false")
    List<Trip> findTripsNeedingReconciliation();
}

