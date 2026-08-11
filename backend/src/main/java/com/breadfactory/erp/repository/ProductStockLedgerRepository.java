package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.ProductStockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductStockLedgerRepository extends JpaRepository<ProductStockLedger, Long> {
    List<ProductStockLedger> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<ProductStockLedger> findAllByOrderByCreatedAtDesc();
}
