package com.breadfactory.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleDTO {
    private Long id;
    private String vehicleCode;
    private String vehicleNumber;
    private String model;
    private String type;
    private BigDecimal capacityKg;
    private String status;
    private String assignedDriver;
    private String driverPhone;
    private String assignedRoute;
    private LocalDate fitnessExpiry;
    private String insuranceNo;
    private LocalDate insuranceExpiry;
    private String pucCertificateNo;
    private LocalDate pucExpiry;
    private String complianceBadge;
    private String rcDocumentName;
    private Boolean isActive;
    private Long warehouseId;
}

