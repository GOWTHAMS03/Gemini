package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DailyCashClosing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyCashClosingRepository extends JpaRepository<DailyCashClosing, Long> {
    Optional<DailyCashClosing> findByClosingDate(LocalDate closingDate);
    Optional<DailyCashClosing> findTopByOrderByClosingDateDesc();
}
