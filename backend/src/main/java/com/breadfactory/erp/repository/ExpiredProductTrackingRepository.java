package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.ExpiredProductTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpiredProductTrackingRepository extends JpaRepository<ExpiredProductTracking, Long> {
    List<ExpiredProductTracking> findByShopIdOrderByCreatedAtDesc(Long shopId);
    List<ExpiredProductTracking> findAllByOrderByCreatedAtDesc();
}
