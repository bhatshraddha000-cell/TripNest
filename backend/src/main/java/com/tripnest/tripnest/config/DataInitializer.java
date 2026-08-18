package com.tripnest.tripnest.config;

import java.util.List;
import java.util.Set;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking database configuration and seeding initial data...");

        // Ensure roles exist
        roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_TRAVELER).build()));
        
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));

        roleRepository.findByName(RoleName.ROLE_GROUP_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_GROUP_ADMIN).build()));

        // Cleanup dummy/example users if present
        cleanupDummyUsers();

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

    private void cleanupDummyUsers() {
        try {
            String dummyUserFilter = "SELECT id FROM users WHERE email IN ('user1@example.com','user2@example.com','traveler@example.com','admin@example.com','abc@example.com','demo@example.com') OR full_name IN ('User One','User Two','Normal Traveler','System Admin','Traveler User','abc') OR id IN (582, 583)";

            jdbcTemplate.execute("DELETE FROM password_reset_tokens WHERE user_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM notifications WHERE receiver_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM activity_logs WHERE user_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM expense_splits WHERE user_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_chat_messages WHERE sender_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_invitations WHERE inviter_id IN (" + dummyUserFilter + ") OR receiver_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_reminders WHERE user_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_members WHERE user_id IN (" + dummyUserFilter + ")");

            String dummyTripFilter = "SELECT id FROM trips WHERE user_id IN (" + dummyUserFilter + ")";
            jdbcTemplate.execute("DELETE FROM documents WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE trip_id IN (" + dummyTripFilter + "))");
            jdbcTemplate.execute("DELETE FROM expenses WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM activities WHERE itinerary_id IN (SELECT id FROM itineraries WHERE trip_id IN (" + dummyTripFilter + "))");
            jdbcTemplate.execute("DELETE FROM itineraries WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_members WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_invitations WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_reminders WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM trip_chat_messages WHERE trip_id IN (" + dummyTripFilter + ")");
            jdbcTemplate.execute("DELETE FROM trips WHERE user_id IN (" + dummyUserFilter + ")");

            jdbcTemplate.execute("DELETE FROM user_roles WHERE user_id IN (" + dummyUserFilter + ")");
            jdbcTemplate.execute("DELETE FROM users WHERE (email IN ('user1@example.com','user2@example.com','traveler@example.com','admin@example.com','abc@example.com','demo@example.com') OR full_name IN ('User One','User Two','Normal Traveler','System Admin','Traveler User','abc') OR id IN (582, 583)) AND email != 'admin@tripnest.com'");
            log.info("Direct SQL purge of dummy/demo users completed.");
        } catch (Exception e) {
            log.warn("Error purging dummy users: {}", e.getMessage());
        }
    }
}
