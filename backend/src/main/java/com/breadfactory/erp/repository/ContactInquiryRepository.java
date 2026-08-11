package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.ContactInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactInquiryRepository extends JpaRepository<ContactInquiry, Long> {
    List<ContactInquiry> findByStatusOrderByCreatedAtDesc(String status);
    List<ContactInquiry> findAllByOrderByCreatedAtDesc();
}
