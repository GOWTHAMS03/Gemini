package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Delivery;
import com.breadfactory.erp.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByDeliveryNumber(String deliveryNumber);
    List<Delivery> findByTripId(Long tripId);
    List<Delivery> findByShopId(Long shopId);
    List<Delivery> findByDriverIdAndStatus(Long driverId, DeliveryStatus status);
}
