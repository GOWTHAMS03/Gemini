package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DailyTripShop;
import com.breadfactory.erp.enums.ShopVisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyTripShopRepository extends JpaRepository<DailyTripShop, Long> {

    List<DailyTripShop> findByDailyTripPlanIdOrderByVisitSequenceAsc(Long dailyTripPlanId);

    List<DailyTripShop> findByDailyTripPlanIdAndVisitStatus(Long dailyTripPlanId, ShopVisitStatus status);

    void deleteByDailyTripPlanId(Long dailyTripPlanId);

    long countByDailyTripPlanId(Long dailyTripPlanId);

    long countByDailyTripPlanIdAndVisitStatus(Long dailyTripPlanId, ShopVisitStatus status);
}
