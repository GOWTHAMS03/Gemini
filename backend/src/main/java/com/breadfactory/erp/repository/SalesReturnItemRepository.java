package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.SalesReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesReturnItemRepository extends JpaRepository<SalesReturnItem, Long> {
    List<SalesReturnItem> findBySalesReturnId(Long salesReturnId);
    List<SalesReturnItem> findByOriginalInvoiceItemId(Long originalInvoiceItemId);
}
