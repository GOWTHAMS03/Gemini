package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DeliveryAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryAcknowledgementRepository extends JpaRepository<DeliveryAcknowledgement, Long> {
}
