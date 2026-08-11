package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.PurchaseInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, Long> {
    List<PurchaseInvoice> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);
    List<PurchaseInvoice> findAllByOrderByCreatedAtDesc();
}
