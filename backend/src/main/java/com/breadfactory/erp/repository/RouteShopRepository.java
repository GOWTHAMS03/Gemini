package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.RouteShop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteShopRepository extends JpaRepository<RouteShop, Long> {
    List<RouteShop> findByRouteIdOrderByVisitOrderAsc(Long routeId);
    void deleteByRouteId(Long routeId);
    void deleteByRouteIdAndShopId(Long routeId, Long shopId);
    List<RouteShop> findByShopId(Long shopId);
}
