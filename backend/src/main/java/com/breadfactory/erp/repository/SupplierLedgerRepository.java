package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.SupplierLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierLedgerRepository extends JpaRepository<SupplierLedger, Long> {
    List<SupplierLedger> findBySupplierIdOrderByCreatedAtAsc(Long supplierId);
    Optional<SupplierLedger> findTopBySupplierIdOrderByCreatedAtDescIdDesc(Long supplierId);
}
