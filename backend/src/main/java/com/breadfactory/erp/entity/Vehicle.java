package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_code", length = 30)
    private String vehicleCode;

    @Column(name = "vehicle_number", nullable = false, unique = true, length = 30)
    private String vehicleNumber;

    @Column(length = 100)
    private String model;

    @Column(length = 50)
    private String type;

    @Column(name = "capacity_kg", precision = 10, scale = 2)
    private BigDecimal capacityKg;

    @Column(length = 30)
    private String status;

    @Column(name = "assigned_driver", length = 100)
    private String assignedDriver;

    @Column(name = "driver_phone", length = 30)
    private String driverPhone;

    @Column(name = "assigned_route", length = 150)
    private String assignedRoute;

    @Column(name = "fitness_expiry")
    private LocalDate fitnessExpiry;

    @Column(name = "insurance_no", length = 100)
    private String insuranceNo;

    @Column(name = "insurance_expiry")
    private LocalDate insuranceExpiry;

    @Column(name = "puc_certificate_no", length = 100)
    private String pucCertificateNo;

    @Column(name = "puc_expiry")
    private LocalDate pucExpiry;

    @Column(name = "compliance_badge", length = 50)
    private String complianceBadge;

    @Column(name = "rc_document_name", length = 255)
    private String rcDocumentName;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;
}

