package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.TripShopVisit;
import com.breadfactory.erp.enums.ShopVisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripShopVisitRepository extends JpaRepository<TripShopVisit, Long> {

    List<TripShopVisit> findByTripId(Long tripId);

    List<TripShopVisit> findByTripIdOrderByVisitSequence(Long tripId);

    List<TripShopVisit> findByTripIdAndStatus(Long tripId, ShopVisitStatus status);

    Optional<TripShopVisit> findByTripIdAndShopId(Long tripId, Long shopId);

    /**
     * Count completed visits for a trip
     */
    @Query("SELECT COUNT(tsv) FROM TripShopVisit tsv WHERE tsv.trip.id = :tripId AND tsv.status = :status")
    Integer countByTripIdAndStatus(@Param("tripId") Long tripId, @Param("status") ShopVisitStatus status);

    /**
     * Get all shops pending visit for a trip
     */
    @Query("SELECT tsv FROM TripShopVisit tsv WHERE tsv.trip.id = :tripId AND tsv.status = 'SCHEDULED' ORDER BY tsv.visitSequence")
    List<TripShopVisit> findPendingShopsForTrip(@Param("tripId") Long tripId);
}
