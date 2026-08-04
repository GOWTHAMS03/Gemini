package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.ProductionRun;
import com.breadfactory.erp.enums.ProductionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionRunRepository extends JpaRepository<ProductionRun, Long> {
    Optional<ProductionRun> findByRunNumber(String runNumber);
    List<ProductionRun> findByStatus(ProductionStatus status);
}
