package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    List<SalesReturn> findByShopIdOrderByReturnDateDesc(Long shopId);
    List<SalesReturn> findByOriginalInvoiceId(Long originalInvoiceId);
    List<SalesReturn> findAllByOrderByReturnDateDesc();
}
