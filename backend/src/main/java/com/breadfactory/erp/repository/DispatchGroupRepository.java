package com.breadfactory.erp.repository;

import com.breadfactory.erp.entity.DispatchGroup;
import com.breadfactory.erp.enums.DispatchGroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchGroupRepository extends JpaRepository<DispatchGroup, Long> {

    List<DispatchGroup> findByStatus(DispatchGroupStatus status);

    List<DispatchGroup> findByIsActive(Boolean isActive);

    List<DispatchGroup> findByStatusAndIsActive(DispatchGroupStatus status, Boolean isActive);

    Optional<DispatchGroup> findByGroupName(String groupName);

    List<DispatchGroup> findBySalesPersonId(Long salesPersonId);

    List<DispatchGroup> findByDriverId(Long driverId);

    List<DispatchGroup> findByVehicleId(Long vehicleId);
}
