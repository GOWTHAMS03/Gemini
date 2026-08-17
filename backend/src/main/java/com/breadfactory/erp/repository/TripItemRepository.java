package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.TripItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripItemRepository extends JpaRepository<TripItem, Long> {
    List<TripItem> findByTripId(Long tripId);
    List<TripItem> findByProductId(Long productId);
}
