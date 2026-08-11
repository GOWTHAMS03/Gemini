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

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users/sales-executives")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalesExecutiveController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Data
    public static class SalesExecutiveRequest {
        private String username;
        private String password;
        private String fullName;
        private String email;
        private String phone;
        private Boolean isActive;
        private Boolean mobileAccessEnabled;
        private Set<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesExecutiveDto {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private Boolean isActive;
        private Boolean mobileAccessEnabled;
        private Set<String> permissions;
        private ZonedDateTime createdAt;
    }

    private SalesExecutiveDto mapToDto(User user) {
        return SalesExecutiveDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .mobileAccessEnabled(user.getMobileAccessEnabled())
                .permissions(user.getPermissions())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @GetMapping
    public ResponseEntity<List<SalesExecutiveDto>> getAllSalesExecutives() {
        List<SalesExecutiveDto> dtos = userRepository.findAll().stream()
                .filter(user -> user.getRoles().stream()
                        .anyMatch(r -> r.getName() == RoleName.ROLE_SALES_EXECUTIVE || r.getName() == RoleName.ROLE_DRIVER))
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> createSalesExecutive(@RequestBody SalesExecutiveRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        Role salesExecRole = roleRepository.findByName(RoleName.ROLE_SALES_EXECUTIVE)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_SALES_EXECUTIVE).description("Sales Executive").build()));
        Role driverRole = roleRepository.findByName(RoleName.ROLE_DRIVER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_DRIVER).description("Driver").build()));

        Set<Role> roles = new HashSet<>();
        roles.add(salesExecRole);
        roles.add(driverRole);

        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .mobileAccessEnabled(request.getMobileAccessEnabled() != null ? request.getMobileAccessEnabled() : true)
                .permissions(request.getPermissions() != null ? request.getPermissions() : new HashSet<>())
                .roles(roles)
                .build();

        User saved = userRepository.save(newUser);
        return ResponseEntity.ok(mapToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSalesExecutive(@PathVariable Long id, @RequestBody SalesExecutiveRequest request) {
        return userRepository.findById(id)
                .map(user -> {
                    if (request.getFullName() != null) user.setFullName(request.getFullName());
                    if (request.getEmail() != null) user.setEmail(request.getEmail());
                    if (request.getPhone() != null) user.setPhone(request.getPhone());
                    if (request.getIsActive() != null) user.setIsActive(request.getIsActive());
                    if (request.getMobileAccessEnabled() != null) user.setMobileAccessEnabled(request.getMobileAccessEnabled());
                    if (request.getPermissions() != null) user.setPermissions(request.getPermissions());
                    if (request.getPassword() != null && !request.getPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(request.getPassword()));
                    }
                    User updated = userRepository.save(user);
                    return ResponseEntity.ok(mapToDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalesExecutive(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
