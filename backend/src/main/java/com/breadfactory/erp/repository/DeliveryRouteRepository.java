package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DeliveryRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryRouteRepository extends JpaRepository<DeliveryRoute, Long> {
    Optional<DeliveryRoute> findByRouteCode(String routeCode);
    Optional<DeliveryRoute> findByRouteName(String routeName);
}
