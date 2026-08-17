package com.breadfactory.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(unique = true, length = 150)
    private String email;

    @Column(unique = true, length = 30)
    private String phone;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @Column(name = "deleted_at")
    private ZonedDateTime deletedAt;

    @Builder.Default
    @Column(name = "mobile_access_enabled")
    private Boolean mobileAccessEnabled = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "permission")
    @Builder.Default
    private Set<String> permissions = new HashSet<>();

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String designation;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "basic_salary", precision = 12, scale = 2)
    private java.math.BigDecimal basicSalary;

    // ─── Driver-specific fields ──────────────────────────────────────────────

    @Column(name = "emergency_contact", length = 30)
    private String emergencyContact;

    @Column(name = "assigned_vehicle", length = 100)
    private String assignedVehicle;

    @Column(name = "primary_route", length = 150)
    private String primaryRoute;

    @Column(name = "dl_number", length = 50)
    private String dlNumber;

    @Column(name = "dl_expiry_date")
    private LocalDate dlExpiryDate;

    @Column(name = "dl_document_url", length = 500)
    private String dlDocumentUrl;

    @Column(name = "govt_id_type", length = 30)
    private String govtIdType; // AADHAAR, PAN, VOTER_ID

    @Column(name = "govt_id_number", length = 50)
    private String govtIdNumber;

    @Column(name = "police_verification_status", length = 30)
    @Builder.Default
    private String policeVerificationStatus = "PENDING"; // PENDING, VERIFIED, EXPIRED
}
