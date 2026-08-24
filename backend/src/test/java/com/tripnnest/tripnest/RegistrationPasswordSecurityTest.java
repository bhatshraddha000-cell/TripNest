package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tripnest.tripnest.TripnestApplication;
import com.tripnest.tripnest.dto.RegisterRequest;
import com.tripnest.tripnest.exception.TripValidationException;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.AuthService;

@SpringBootTest(classes = TripnestApplication.class)
public class RegistrationPasswordSecurityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.findByEmail("weakuser@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("stronguser1@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("stronguser2@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("stronguser3@example.com").ifPresent(userRepository::delete);
    }

    @Test
    void testRegistration_RejectsWeakPasswords_NoUserCreated() {
        String[] weakPasswords = {
            "password",
            "password123",
            "Password",
            "12345678",
            "abcdefgh",
            "Abcdefgh",
            "abcdefg1!" // < 8 characters
        };

        for (int i = 0; i < weakPasswords.length; i++) {
            String weakPwd = weakPasswords[i];
            String testEmail = "weakuser" + i + "@example.com";
            userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);

            RegisterRequest req = new RegisterRequest();
            req.setFullName("Weak User");
            req.setEmail(testEmail);
            req.setPassword(weakPwd);

            Exception ex = assertThrows(TripValidationException.class, () -> authService.register(req),
                    "Failed to reject weak password: " + weakPwd);

            assertTrue(ex.getMessage().contains("Password must contain at least 8 characters"),
                    "Unexpected message for weak password '" + weakPwd + "': " + ex.getMessage());

            // Confirm no user created in DB
            assertFalse(userRepository.existsByEmail(testEmail),
                    "User was incorrectly created with weak password: " + weakPwd);
        }
    }

    @Test
    void testRegistration_AcceptsStrongPasswords_HashedPasswordStored() {
        String[] strongPasswords = {
            "Password1!",
            "TripNest@2026",
            "Travel#2026"
        };

        for (int i = 0; i < strongPasswords.length; i++) {
            String strongPwd = strongPasswords[i];
            String testEmail = "stronguser" + i + "@example.com";
            userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);

            RegisterRequest req = new RegisterRequest();
            req.setFullName("Strong User " + i);
            req.setEmail(testEmail);
            req.setPassword(strongPwd);

            assertDoesNotThrow(() -> authService.register(req));

            User savedUser = userRepository.findByEmail(testEmail).orElseThrow();
            assertNotNull(savedUser.getId());
            assertNotEquals(strongPwd, savedUser.getPassword(), "Plaintext password must NOT be stored!");
            assertTrue(passwordEncoder.matches(strongPwd, savedUser.getPassword()), "BCrypt hash must match!");
        }
    }
}
