package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.CashBankTransaction;
import com.breadfactory.erp.enums.CashBankType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashBankTransactionRepository extends JpaRepository<CashBankTransaction, Long> {
    List<CashBankTransaction> findByAccountTypeOrderByCreatedAtDesc(CashBankType accountType);
    Optional<CashBankTransaction> findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType accountType);
    List<CashBankTransaction> findAllByOrderByCreatedAtDesc();
}
