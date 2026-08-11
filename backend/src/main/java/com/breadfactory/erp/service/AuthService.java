package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.AuthRequest;
import com.breadfactory.erp.dto.AuthResponse;
import com.breadfactory.erp.dto.RegisterRequest;
import com.breadfactory.erp.entity.Role;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.RoleName;
import com.breadfactory.erp.repository.RoleRepository;
import com.breadfactory.erp.repository.UserRepository;
import com.breadfactory.erp.security.JwtTokenProvider;
import com.breadfactory.erp.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse authenticateUser(AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Set<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(jwt)
                .id(userPrincipal.getId())
                .username(userPrincipal.getUsername())
                .fullName(userPrincipal.getFullName())
                .email(userPrincipal.getEmail())
                .roles(roles)
                .mobileAccessEnabled(userPrincipal.getMobileAccessEnabled())
                .build();
    }

    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        Set<Role> roles = new HashSet<>();
        if (registerRequest.getRoles() != null && !registerRequest.getRoles().isEmpty()) {
            registerRequest.getRoles().forEach(roleStr -> {
                Role role = roleRepository.findByName(RoleName.valueOf(roleStr))
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleStr));
                roles.add(role);
            });
        } else {
            Role userRole = roleRepository.findByName(RoleName.ROLE_SHOP_OWNER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            roles.add(userRole);
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .phone(registerRequest.getPhone())
                .roles(roles)
                .isActive(true)
                .build();

        return userRepository.save(user);
    }
}
