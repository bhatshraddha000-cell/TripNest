package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tripnest.tripnest.TripnestApplication;
import com.tripnest.tripnest.dto.DeleteAccountRequest;
import com.tripnest.tripnest.dto.ResetPasswordRequest;
import com.tripnest.tripnest.exception.TripValidationException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.PasswordResetToken;
import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.tripnest.repository.RoleRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.PasswordResetService;
import com.tripnest.tripnest.service.UserService;
import com.tripnest.tripnest.util.PasswordPolicyValidator;

@SpringBootTest(classes = TripnestApplication.class)
public class PasswordSecurityAndAccountDeleteTest {

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private User adminUser;
    private Role travelerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();

        travelerRole = roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_TRAVELER).build()));

        adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));

        testUser = userRepository.findByEmail("secuser@example.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Security Test User")
                        .email("secuser@example.com")
                        .password(passwordEncoder.encode("OldSecret@2026"))
                        .roles(Set.of(travelerRole))
                        .build()));

        adminUser = userRepository.findByEmail("admin@tripnest.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("System Admin")
                        .email("admin@tripnest.com")
                        .password(passwordEncoder.encode("AdminSecret@2026"))
                        .roles(Set.of(adminRole))
                        .build()));
    }

    @Test
    void testPasswordPolicyValidation_RejectsWeakPasswords() {
        // 1. Weak / plain
        assertThrows(TripValidationException.class, () -> PasswordPolicyValidator.validate("password"));

        // 2. Missing uppercase
        assertThrows(TripValidationException.class, () -> PasswordPolicyValidator.validate("travel@2026"));

        // 3. Missing lowercase
        assertThrows(TripValidationException.class, () -> PasswordPolicyValidator.validate("TRAVEL@2026"));

        // 4. Missing number
        assertThrows(TripValidationException.class, () -> PasswordPolicyValidator.validate("Travel@Special"));

        // 5. Missing special character
        assertThrows(TripValidationException.class, () -> PasswordPolicyValidator.validate("Travel2026"));

        // 6. Valid password
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Travel@2026"));
    }

    @Test
    void testForgotPassword_RateLimitCooldown() {
        assertDoesNotThrow(() -> passwordResetService.forgotPassword("secuser@example.com"));

        // Second request immediately after -> expected rate limit exception
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                passwordResetService.forgotPassword("secuser@example.com")
        );
        assertTrue(ex.getMessage().contains("Please wait before requesting another OTP"));
    }

    @Test
    void testOTP_MaxAttemptsExceeded() {
        assertDoesNotThrow(() -> passwordResetService.forgotPassword("secuser@example.com"));

        PasswordResetToken token = passwordResetTokenRepository.findByUser(testUser).orElseThrow();
        String wrongOtp = token.getToken().equals("111111") ? "222222" : "111111";

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("secuser@example.com");
        req.setToken(wrongOtp);
        req.setNewPassword("NewSecret@2026");
        req.setConfirmPassword("NewSecret@2026");

        // Attempts 1 to 4: returns Invalid OTP
        for (int i = 0; i < 4; i++) {
            Exception ex = assertThrows(IllegalArgumentException.class, () -> passwordResetService.resetPassword(req));
            assertTrue(ex.getMessage().contains("Invalid OTP"));
        }

        // Attempt 5: triggers attempt limit and invalidates token
        Exception ex = assertThrows(IllegalArgumentException.class, () -> passwordResetService.resetPassword(req));
        assertTrue(ex.getMessage().contains("Too many failed attempts"));
        assertFalse(passwordResetTokenRepository.findByUser(testUser).isPresent());
    }

    @Test
    void testDeleteUserAccount_WrongPassword_Rejects() {
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        DeleteAccountRequest deleteReq = new DeleteAccountRequest("WrongPassword@123");
        Exception ex = assertThrows(IllegalArgumentException.class, () -> userService.deleteCurrentUserAccount(deleteReq));
        assertTrue(ex.getMessage().contains("Invalid password"));

        assertTrue(userRepository.existsById(testUser.getId()));
    }

    @Test
    void testDeleteUserAccount_SystemAdmin_Protected() {
        CustomUserDetails adminDetails = new CustomUserDetails(adminUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(adminDetails, null, adminDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        DeleteAccountRequest deleteReq = new DeleteAccountRequest("AdminSecret@2026");
        Exception ex = assertThrows(IllegalArgumentException.class, () -> userService.deleteCurrentUserAccount(deleteReq));
        assertTrue(ex.getMessage().contains("System Administrator account cannot be deleted"));

        assertTrue(userRepository.existsById(adminUser.getId()));
    }

    @Test
    void testDeleteUserAccount_Success() {
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        DeleteAccountRequest deleteReq = new DeleteAccountRequest("OldSecret@2026");
        assertDoesNotThrow(() -> userService.deleteCurrentUserAccount(deleteReq));

        assertFalse(userRepository.existsById(testUser.getId()));
    }
}
