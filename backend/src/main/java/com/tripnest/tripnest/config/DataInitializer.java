package com.tripnest.tripnest.config;

import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.RoleRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking database configuration and seeding initial data...");

        // Ensure roles exist
        roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_TRAVELER).build()));
        
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));

        roleRepository.findByName(RoleName.ROLE_GROUP_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_GROUP_ADMIN).build()));

        // Seed system admin user
        String adminEmail = "admin@tripnest.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .fullName("System Administrator")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .roles(Set.of(adminRole))
                    .build();
            userRepository.save(admin);
            log.info("System administrator user successfully seeded (email: admin@tripnest.com)");
        } else {
            log.info("System administrator user already exists.");
        }
    }
}
