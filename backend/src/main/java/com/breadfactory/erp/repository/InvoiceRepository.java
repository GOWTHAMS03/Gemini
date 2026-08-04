package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByShopId(Long shopId);
    List<Invoice> findByTripId(Long tripId);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate")
    BigDecimal calculateTotalRevenue(@Param("startDate") ZonedDateTime startDate, @Param("endDate") ZonedDateTime endDate);
}
