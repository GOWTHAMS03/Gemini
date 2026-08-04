package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DriverCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverCollectionRepository extends JpaRepository<DriverCollection, Long> {
    Optional<DriverCollection> findByTripId(Long tripId);
    Optional<DriverCollection> findByCollectionCode(String collectionCode);
}
