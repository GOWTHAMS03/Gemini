package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.CreditNote;
import com.breadfactory.erp.enums.CreditNoteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditNoteRepository extends JpaRepository<CreditNote, Long> {
    List<CreditNote> findByShopIdOrderByIssuedAtDesc(Long shopId);
    List<CreditNote> findByShopIdAndStatusIn(Long shopId, List<CreditNoteStatus> statuses);
    Optional<CreditNote> findByCreditNoteNumber(String creditNoteNumber);
    List<CreditNote> findAllByOrderByIssuedAtDesc();
}
