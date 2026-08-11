package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DamagedProductTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DamagedProductTrackingRepository extends JpaRepository<DamagedProductTracking, Long> {

    List<DamagedProductTracking> findByProductId(Long productId);

    List<DamagedProductTracking> findByTripId(Long tripId);

    List<DamagedProductTracking> findByVehicleId(Long vehicleId);

    List<DamagedProductTracking> findByReason(String reason);

    /**
     * Get all damaged products for a specific trip
     */
    @Query("SELECT dpt FROM DamagedProductTracking dpt WHERE dpt.trip.id = :tripId ORDER BY dpt.createdAt DESC")
    List<DamagedProductTracking> findDamagedProductsForTrip(@Param("tripId") Long tripId);

    /**
     * Get total damaged quantity for a trip
     */
    @Query("SELECT SUM(dpt.quantity) FROM DamagedProductTracking dpt WHERE dpt.trip.id = :tripId")
    Integer getTotalDamagedQuantityForTrip(@Param("tripId") Long tripId);
}
