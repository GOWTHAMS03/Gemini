package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.ShopRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopRouteRepository extends JpaRepository<ShopRoute, Long> {

    List<ShopRoute> findByRouteGroupId(Long routeGroupId);

    List<ShopRoute> findByRouteGroupIdAndIsActive(Long routeGroupId, Boolean isActive);

    List<ShopRoute> findByShopId(Long shopId);

    List<ShopRoute> findByRouteGroupIdAndVisitDay(Long routeGroupId, Integer visitDay);

    List<ShopRoute> findByRouteGroupIdAndVisitDayOrderByVisitSequence(Long routeGroupId, Integer visitDay);

    /**
     * Find shops scheduled for a specific route and day, ordered by sequence
     */
    @Query("SELECT sr FROM ShopRoute sr WHERE sr.routeGroup.id = :routeGroupId AND sr.visitDay = :visitDay AND sr.isActive = true ORDER BY sr.visitSequence")
    List<ShopRoute> findScheduledShopsForDay(@Param("routeGroupId") Long routeGroupId, @Param("visitDay") Integer visitDay);

    /**
     * Check if a shop is already assigned to a route on a specific day
     */
    boolean existsByRouteGroupIdAndShopIdAndVisitDay(Long routeGroupId, Long shopId, Integer visitDay);
}
