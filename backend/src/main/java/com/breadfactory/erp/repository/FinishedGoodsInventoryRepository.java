package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.FinishedGoodsInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinishedGoodsInventoryRepository extends JpaRepository<FinishedGoodsInventory, Long> {
    Optional<FinishedGoodsInventory> findByWarehouseIdAndProductIdAndBatchNumber(Long warehouseId, Long productId, String batchNumber);

    @Query("SELECT fg FROM FinishedGoodsInventory fg WHERE fg.expiryDate <= :alertDate AND fg.quantityAvailable > 0")
    List<FinishedGoodsInventory> findExpiringProducts(@Param("alertDate") LocalDate alertDate);

    @Query("SELECT SUM(fg.quantityAvailable) FROM FinishedGoodsInventory fg WHERE fg.product.id = :productId")
    Integer findTotalStockByProduct(@Param("productId") Long productId);
}
