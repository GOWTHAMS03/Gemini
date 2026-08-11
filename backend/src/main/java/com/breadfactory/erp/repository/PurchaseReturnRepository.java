package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.PurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {
    List<PurchaseReturn> findBySupplierIdOrderByReturnDateDesc(Long supplierId);
    List<PurchaseReturn> findAllByOrderByReturnDateDesc();
}
