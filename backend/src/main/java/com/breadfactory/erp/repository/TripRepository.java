package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByTripNumber(String tripNumber);
    List<Trip> findByDriverIdAndStatus(Long driverId, TripStatus status);
    List<Trip> findByStatus(TripStatus status);
}
