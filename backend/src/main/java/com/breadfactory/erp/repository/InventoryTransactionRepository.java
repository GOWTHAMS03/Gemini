package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.InventoryTransaction;
import com.breadfactory.erp.enums.InventoryTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByTransactionType(InventoryTransactionType transactionType);

    List<InventoryTransaction> findByTripId(Long tripId);

    List<InventoryTransaction> findByProductId(Long productId);

    List<InventoryTransaction> findByVehicleId(Long vehicleId);

    List<InventoryTransaction> findByWarehouseId(Long warehouseId);

    List<InventoryTransaction> findByReferenceNumber(String referenceNumber);

    /**
     * Get all warehouse to trip transactions for a specific trip
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.trip.id = :tripId AND it.transactionType = 'WAREHOUSE_TO_TRIP' ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findWarehouseToTripTransactions(@Param("tripId") Long tripId);

    /**
     * Get all stock movements for a product in a specific time period
     */
    @Query("SELECT it FROM InventoryTransaction it WHERE it.product.id = :productId AND it.createdAt BETWEEN :startDate AND :endDate ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findProductMovementsInPeriod(
            @Param("productId") Long productId,
            @Param("startDate") ZonedDateTime startDate,
            @Param("endDate") ZonedDateTime endDate
    );
}
