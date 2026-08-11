package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Factory;
import com.breadfactory.erp.enums.FactoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FactoryRepository extends JpaRepository<Factory, Long> {
    Optional<Factory> findByFactoryCode(String factoryCode);
    long countByStatus(FactoryStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.dailyCapacityBags), 0) FROM Factory f WHERE f.isActive = true")
    Integer sumDailyCapacityBags();
}
