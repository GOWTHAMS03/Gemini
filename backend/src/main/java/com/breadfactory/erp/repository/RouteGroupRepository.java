package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.RouteGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteGroupRepository extends JpaRepository<RouteGroup, Long> {

    Optional<RouteGroup> findByRouteName(String routeName);

    List<RouteGroup> findByIsActive(Boolean isActive);

    List<RouteGroup> findByAreaRegion(String areaRegion);

    List<RouteGroup> findByAreaRegionAndIsActive(String areaRegion, Boolean isActive);
}
