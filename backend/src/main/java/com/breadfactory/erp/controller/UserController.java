package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.Role;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.RoleName;
import com.breadfactory.erp.repository.RoleRepository;
import com.breadfactory.erp.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Data
    @Builder
    public static class UserResponseDTO {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private Boolean isActive;
        private Boolean mobileAccessEnabled;
        private Set<String> roles;
        private ZonedDateTime createdAt;
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getUsers(@RequestParam(required = false) String role) {
        List<User> users = userRepository.findAll();

        if (role != null && !role.trim().isEmpty()) {
            final String filterRole = role.trim().toUpperCase();
            users = users.stream().filter(u -> u.getRoles().stream().anyMatch(r -> {
                String roleStr = r.getName().name();
                return roleStr.equalsIgnoreCase(filterRole) 
                        || roleStr.equalsIgnoreCase("ROLE_" + filterRole)
                        || filterRole.equalsIgnoreCase(roleStr.replace("ROLE_", ""));
            })).collect(Collectors.toList());
        }

        List<UserResponseDTO> response = users.stream().map(this::mapToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(this::mapToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private UserResponseDTO mapToDTO(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .mobileAccessEnabled(user.getMobileAccessEnabled())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
