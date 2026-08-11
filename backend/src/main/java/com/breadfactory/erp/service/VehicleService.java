package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.VehicleDTO;
import com.breadfactory.erp.entity.Vehicle;
import com.breadfactory.erp.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleDTO getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    @Transactional
    public VehicleDTO createVehicle(VehicleDTO dto) {
        Vehicle vehicle = Vehicle.builder()
                .vehicleCode(dto.getVehicleCode() != null ? dto.getVehicleCode() : "VH-" + System.currentTimeMillis() % 1000)
                .vehicleNumber(dto.getVehicleNumber())
                .model(dto.getModel())
                .type(dto.getType() != null ? dto.getType() : "Mini Truck")
                .capacityKg(dto.getCapacityKg())
                .status(dto.getStatus() != null ? dto.getStatus() : "AVAILABLE")
                .assignedDriver(dto.getAssignedDriver())
                .driverPhone(dto.getDriverPhone())
                .assignedRoute(dto.getAssignedRoute())
                .fitnessExpiry(dto.getFitnessExpiry())
                .insuranceNo(dto.getInsuranceNo())
                .insuranceExpiry(dto.getInsuranceExpiry())
                .pucCertificateNo(dto.getPucCertificateNo())
                .pucExpiry(dto.getPucExpiry())
                .complianceBadge(dto.getComplianceBadge() != null ? dto.getComplianceBadge() : "FULLY_COMPLIANT")
                .rcDocumentName(dto.getRcDocumentName() != null ? dto.getRcDocumentName() : "RC_Certificate.pdf")
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);
        return mapToDTO(saved);
    }

    @Transactional
    public VehicleDTO updateVehicle(Long id, VehicleDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        if (dto.getVehicleNumber() != null) vehicle.setVehicleNumber(dto.getVehicleNumber());
        if (dto.getVehicleCode() != null) vehicle.setVehicleCode(dto.getVehicleCode());
        if (dto.getModel() != null) vehicle.setModel(dto.getModel());
        if (dto.getType() != null) vehicle.setType(dto.getType());
        if (dto.getCapacityKg() != null) vehicle.setCapacityKg(dto.getCapacityKg());
        if (dto.getStatus() != null) vehicle.setStatus(dto.getStatus());
        if (dto.getAssignedDriver() != null) vehicle.setAssignedDriver(dto.getAssignedDriver());
        if (dto.getDriverPhone() != null) vehicle.setDriverPhone(dto.getDriverPhone());
        if (dto.getAssignedRoute() != null) vehicle.setAssignedRoute(dto.getAssignedRoute());
        if (dto.getFitnessExpiry() != null) vehicle.setFitnessExpiry(dto.getFitnessExpiry());
        if (dto.getInsuranceNo() != null) vehicle.setInsuranceNo(dto.getInsuranceNo());
        if (dto.getInsuranceExpiry() != null) vehicle.setInsuranceExpiry(dto.getInsuranceExpiry());
        if (dto.getPucCertificateNo() != null) vehicle.setPucCertificateNo(dto.getPucCertificateNo());
        if (dto.getPucExpiry() != null) vehicle.setPucExpiry(dto.getPucExpiry());
        if (dto.getComplianceBadge() != null) vehicle.setComplianceBadge(dto.getComplianceBadge());
        if (dto.getRcDocumentName() != null) vehicle.setRcDocumentName(dto.getRcDocumentName());
        if (dto.getIsActive() != null) vehicle.setIsActive(dto.getIsActive());

        Vehicle updated = vehicleRepository.save(vehicle);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        jdbcTemplate.update("UPDATE dispatch_groups SET vehicle_id = NULL WHERE vehicle_id = ?", id);
        jdbcTemplate.update("UPDATE trips SET vehicle_id = NULL WHERE vehicle_id = ?", id);
        vehicleRepository.deleteById(id);
    }

    private VehicleDTO mapToDTO(Vehicle vehicle) {
        return VehicleDTO.builder()
                .id(vehicle.getId())
                .vehicleCode(vehicle.getVehicleCode() != null ? vehicle.getVehicleCode() : "VH-" + String.format("%03d", vehicle.getId()))
                .vehicleNumber(vehicle.getVehicleNumber())
                .model(vehicle.getModel())
                .type(vehicle.getType())
                .capacityKg(vehicle.getCapacityKg())
                .status(vehicle.getStatus() != null ? vehicle.getStatus() : "AVAILABLE")
                .assignedDriver(vehicle.getAssignedDriver())
                .driverPhone(vehicle.getDriverPhone())
                .assignedRoute(vehicle.getAssignedRoute())
                .fitnessExpiry(vehicle.getFitnessExpiry())
                .insuranceNo(vehicle.getInsuranceNo())
                .insuranceExpiry(vehicle.getInsuranceExpiry())
                .pucCertificateNo(vehicle.getPucCertificateNo())
                .pucExpiry(vehicle.getPucExpiry())
                .complianceBadge(vehicle.getComplianceBadge() != null ? vehicle.getComplianceBadge() : "FULLY_COMPLIANT")
                .rcDocumentName(vehicle.getRcDocumentName())
                .isActive(vehicle.getIsActive())
                .warehouseId(vehicle.getWarehouse() != null ? vehicle.getWarehouse().getId() : null)
                .build();
    }
}

