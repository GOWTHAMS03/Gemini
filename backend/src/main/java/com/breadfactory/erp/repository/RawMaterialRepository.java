package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.RawMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, Long> {
    Optional<RawMaterial> findByMaterialCode(String materialCode);

    @Query("SELECT COALESCE(SUM(r.currentStock), 0) FROM RawMaterial r")
    Double sumTotalCurrentStock();

    @Query("SELECT COALESCE(SUM(r.currentStock * r.unitCost), 0) FROM RawMaterial r")
    java.math.BigDecimal calculateTotalValuation();

    @Query("SELECT r FROM RawMaterial r WHERE r.currentStock <= r.minStockAlert")
    List<RawMaterial> findLowStockMaterials();
}
