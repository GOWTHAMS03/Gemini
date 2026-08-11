package com.breadfactory.erp.config;

import com.breadfactory.erp.entity.Role;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.RoleName;
import com.breadfactory.erp.repository.RoleRepository;
import com.breadfactory.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing system roles and admin account...");

        // 0. Drop legacy check constraints if present
        try {
            jdbcTemplate.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check");
            jdbcTemplate.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_beta_payment_status_check");
            jdbcTemplate.execute("ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_settlement_status_check");
        } catch (Exception e) {
            log.debug("Constraint drop skipped: {}", e.getMessage());
        }

        // 1. Seed System Roles
        for (RoleName rn : RoleName.values()) {
            roleRepository.findByName(rn).orElseGet(() -> roleRepository.save(Role.builder().name(rn).build()));
        }
        log.info("Verified system roles: {}", List.of(RoleName.values()));

        // 2. Seed Super Admin User
        try {
            if (userRepository.findByUsername("admin").isEmpty()) {
                Set<Role> adminRoles = new HashSet<>();
                roleRepository.findByName(RoleName.ROLE_SUPER_ADMIN).ifPresent(adminRoles::add);
                roleRepository.findByName(RoleName.ROLE_FACTORY_MANAGER).ifPresent(adminRoles::add);
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .fullName("System Administrator")
                        .email("admin@breadfactory.com")
                        .phone("+91 98765 00000")
                        .roles(adminRoles)
                        .isActive(true)
                        .build();
                userRepository.save(admin);
                log.info("Initialized Super Admin User: admin / admin123");
            }
        } catch (Exception e) {
            log.warn("Admin user check skipped: {}", e.getMessage());
        }

        log.info("Bread Factory ERP ready - all business data (employees, shops, products, raw materials, vehicles, recipes, trips) is 100% API driven.");
    }
}
