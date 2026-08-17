package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Role;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.RoleName;
import com.breadfactory.erp.repository.RoleRepository;
import com.breadfactory.erp.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Request / Response DTOs ──────────────────────────────────────────────

    @Data
    public static class EmployeeRequest {
        private String username;
        private String password;
        private String fullName;
        private String email;
        private String phone;
        private Boolean isActive;
        private Boolean mobileAccessEnabled;
        private Set<String> permissions;
        private String roleGroup; // "DRIVER", "SALES_EXECUTIVE", "EMPLOYEE"
        private String department;
        private String designation;
        private Double basicSalary;
        private String joiningDate;
        // Driver-specific
        private String emergencyContact;
        private String assignedVehicle;
        private String primaryRoute;
        private String dlNumber;
        private String dlExpiryDate;
        private String dlDocumentUrl;
        private String govtIdType;
        private String govtIdNumber;
        private String policeVerificationStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeDto {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private Boolean isActive;
        private Boolean mobileAccessEnabled;
        private Set<String> permissions;
        private List<String> roles;
        private String department;
        private String designation;
        private Double basicSalary;
        private String joiningDate;
        // Driver-specific
        private String emergencyContact;
        private String assignedVehicle;
        private String primaryRoute;
        private String dlNumber;
        private String dlExpiryDate;
        private String dlDocumentUrl;
        private String govtIdType;
        private String govtIdNumber;
        private String policeVerificationStatus;
        private ZonedDateTime createdAt;
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private EmployeeDto mapToDto(User user) {
        return EmployeeDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .mobileAccessEnabled(user.getMobileAccessEnabled())
                .permissions(user.getPermissions())
                .roles(user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toList()))
                .department(user.getDepartment())
                .designation(user.getDesignation())
                .basicSalary(user.getBasicSalary() != null ? user.getBasicSalary().doubleValue() : null)
                .joiningDate(user.getJoiningDate() != null ? user.getJoiningDate().toString() : null)
                .emergencyContact(user.getEmergencyContact())
                .assignedVehicle(user.getAssignedVehicle())
                .primaryRoute(user.getPrimaryRoute())
                .dlNumber(user.getDlNumber())
                .dlExpiryDate(user.getDlExpiryDate() != null ? user.getDlExpiryDate().toString() : null)
                .dlDocumentUrl(user.getDlDocumentUrl())
                .govtIdType(user.getGovtIdType())
                .govtIdNumber(user.getGovtIdNumber())
                .policeVerificationStatus(user.getPoliceVerificationStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ─── GET all employees (optional ?role= filter) ───────────────────────────

    @GetMapping
    public ResponseEntity<List<EmployeeDto>> getAll(@RequestParam(required = false) String role) {
        List<User> users = userRepository.findAll();

        if (role != null && !role.isBlank()) {
            final String normalized = role.trim().toUpperCase();
            final String withPrefix = normalized.startsWith("ROLE_") ? normalized : "ROLE_" + normalized;
            final String withoutPrefix = normalized.startsWith("ROLE_") ? normalized.substring(5) : normalized;

            users = users.stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r -> {
                        String rName = r.getName().name().toUpperCase();
                        return rName.equals(withPrefix) || rName.equals(withoutPrefix) || rName.contains(withoutPrefix);
                    }))
                    .collect(Collectors.toList());
        }

        // Exclude SUPER_ADMIN from employee list
        users = users.stream()
                .filter(u -> u.getRoles().stream().noneMatch(r -> r.getName() == RoleName.ROLE_SUPER_ADMIN))
                .collect(Collectors.toList());

        List<EmployeeDto> dtos = users.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // ─── GET single employee ──────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── POST create employee ─────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> create(@RequestBody EmployeeRequest request) {
        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            String rolePrefix = request.getRoleGroup() != null ? request.getRoleGroup().toLowerCase() : "emp";
            String nameSlug = request.getFullName() != null ? request.getFullName().toLowerCase().replaceAll("[^a-z0-9]", "") : "";
            username = rolePrefix + "_" + (nameSlug.isBlank() ? System.currentTimeMillis() : nameSlug + "_" + (System.currentTimeMillis() % 1000));
        }

        if (userRepository.findByUsername(username).isPresent()) {
            // Append timestamp suffix if username conflicts
            username = username + "_" + (System.currentTimeMillis() % 10000);
        }

        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = "password123";
        }

        LocalDate joiningDate = null;
        if (request.getJoiningDate() != null && !request.getJoiningDate().isBlank()) {
            try {
                joiningDate = LocalDate.parse(request.getJoiningDate());
            } catch (Exception ignored) {}
        }

        LocalDate dlExpiryDate = null;
        if (request.getDlExpiryDate() != null && !request.getDlExpiryDate().isBlank()) {
            try {
                dlExpiryDate = LocalDate.parse(request.getDlExpiryDate());
            } catch (Exception ignored) {}
        }

        // Resolve role group
        Set<Role> roles = resolveRoles(request.getRoleGroup());

        Boolean mobileAccess = request.getMobileAccessEnabled();
        if (mobileAccess == null) {
            mobileAccess = "SALES_EXECUTIVE".equalsIgnoreCase(request.getRoleGroup());
        }

        User newUser = User.builder()
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName() : username)
                .email(request.getEmail())
                .phone(request.getPhone())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .mobileAccessEnabled(mobileAccess)
                .permissions(request.getPermissions() != null ? request.getPermissions() : new HashSet<>())
                .roles(roles)
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .basicSalary(request.getBasicSalary() != null ? java.math.BigDecimal.valueOf(request.getBasicSalary()) : null)
                .joiningDate(joiningDate)
                .emergencyContact(request.getEmergencyContact())
                .assignedVehicle(request.getAssignedVehicle())
                .primaryRoute(request.getPrimaryRoute())
                .dlNumber(request.getDlNumber())
                .dlExpiryDate(dlExpiryDate)
                .dlDocumentUrl(request.getDlDocumentUrl())
                .govtIdType(request.getGovtIdType())
                .govtIdNumber(request.getGovtIdNumber())
                .policeVerificationStatus(request.getPoliceVerificationStatus() != null ? request.getPoliceVerificationStatus() : "PENDING")
                .build();

        User saved = userRepository.save(newUser);
        return ResponseEntity.ok(mapToDto(saved));
    }

    // ─── PUT update employee ──────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody EmployeeRequest request) {
        return userRepository.findById(id)
                .map(user -> {
                    if (request.getFullName() != null && !request.getFullName().isBlank()) user.setFullName(request.getFullName());
                    if (request.getEmail() != null) user.setEmail(request.getEmail());
                    if (request.getPhone() != null) user.setPhone(request.getPhone());
                    if (request.getIsActive() != null) user.setIsActive(request.getIsActive());
                    if (request.getMobileAccessEnabled() != null) user.setMobileAccessEnabled(request.getMobileAccessEnabled());
                    if (request.getPermissions() != null) user.setPermissions(request.getPermissions());
                    if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
                    if (request.getDesignation() != null) user.setDesignation(request.getDesignation());
                    if (request.getBasicSalary() != null) user.setBasicSalary(java.math.BigDecimal.valueOf(request.getBasicSalary()));
                    if (request.getJoiningDate() != null && !request.getJoiningDate().isBlank()) {
                        try { user.setJoiningDate(LocalDate.parse(request.getJoiningDate())); } catch (Exception ignored) {}
                    }
                    if (request.getEmergencyContact() != null) user.setEmergencyContact(request.getEmergencyContact());
                    if (request.getAssignedVehicle() != null) user.setAssignedVehicle(request.getAssignedVehicle());
                    if (request.getPrimaryRoute() != null) user.setPrimaryRoute(request.getPrimaryRoute());
                    if (request.getDlNumber() != null) user.setDlNumber(request.getDlNumber());
                    if (request.getDlExpiryDate() != null && !request.getDlExpiryDate().isBlank()) {
                        try { user.setDlExpiryDate(LocalDate.parse(request.getDlExpiryDate())); } catch (Exception ignored) {}
                    }
                    if (request.getDlDocumentUrl() != null) user.setDlDocumentUrl(request.getDlDocumentUrl());
                    if (request.getGovtIdType() != null) user.setGovtIdType(request.getGovtIdType());
                    if (request.getGovtIdNumber() != null) user.setGovtIdNumber(request.getGovtIdNumber());
                    if (request.getPoliceVerificationStatus() != null) user.setPoliceVerificationStatus(request.getPoliceVerificationStatus());
                    if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(request.getPassword()));
                    }
                    if (request.getRoleGroup() != null && !request.getRoleGroup().isBlank()) {
                        user.setRoles(resolveRoles(request.getRoleGroup()));
                    }
                    User updated = userRepository.save(user);
                    return ResponseEntity.ok(mapToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── PATCH toggle status ──────────────────────────────────────────────────

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setIsActive(!user.getIsActive());
                    User updated = userRepository.save(user);
                    return ResponseEntity.ok(mapToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── DELETE employee ──────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            try {
                userRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                        .body(java.util.Map.of("error", "Cannot delete employee. They are linked to existing records (e.g., trips, invoices). Please deactivate them instead."));
            }
        }
        return ResponseEntity.notFound().build();
    }

    // ─── Helper: resolve role group to actual Role entities ───────────────────

    private Set<Role> resolveRoles(String roleGroup) {
        Set<Role> roles = new HashSet<>();

        if (roleGroup == null || roleGroup.isBlank()) {
            roleGroup = "EMPLOYEE";
        }

        switch (roleGroup.toUpperCase()) {
            case "DRIVER":
                roles.add(findOrCreateRole(RoleName.ROLE_DRIVER, "Driver"));
                break;
            case "SALES_EXECUTIVE":
                roles.add(findOrCreateRole(RoleName.ROLE_SALES_EXECUTIVE, "Sales Executive"));
                break;
            case "EMPLOYEE":
            default:
                roles.add(findOrCreateRole(RoleName.ROLE_EMPLOYEE, "Employee"));
                break;
        }

        return roles;
    }

    private Role findOrCreateRole(RoleName roleName, String description) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(roleName).description(description).build()
                ));
    }
}
