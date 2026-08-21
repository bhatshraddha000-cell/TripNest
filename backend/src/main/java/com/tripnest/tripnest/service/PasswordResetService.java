package com.tripnest.tripnest.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.ResetPasswordRequest;
import com.tripnest.tripnest.model.PasswordResetToken;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.util.PasswordPolicyValidator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final String PASSWORD_RESET_SUCCESS_MESSAGE =
            "If an account exists for that email, a password reset OTP code has been sent.";
    private static final int PASSWORD_RESET_EXPIRATION_MINUTES = 5;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            passwordResetTokenRepository.findByUser(user).ifPresent(existing -> {
                if (existing.getLastRequestedAt() != null &&
                    existing.getLastRequestedAt().isAfter(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS))) {
                    throw new IllegalArgumentException("Please wait before requesting another OTP.");
                }
                passwordResetTokenRepository.delete(existing);
            });

            // Generate a cryptographically secure 6-digit numeric OTP code
            String token;
            do {
                token = String.format("%06d", secureRandom.nextInt(900000) + 100000);
            } while (passwordResetTokenRepository.findByToken(token).isPresent());

            LocalDateTime now = LocalDateTime.now();
            PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                    .token(token)
                    .expiryDate(now.plusMinutes(PASSWORD_RESET_EXPIRATION_MINUTES))
                    .lastRequestedAt(now)
                    .attempts(0)
                    .user(user)
                    .build();

            passwordResetTokenRepository.save(passwordResetToken);
            emailService.sendPasswordResetOtpEmail(user, token);
        });
    }

    @Transactional(noRollbackFor = InvalidPasswordResetTokenException.class)
    public String resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidPasswordResetTokenException("Invalid OTP. Please try again."));

        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByUser(user)
                .orElseThrow(() -> new InvalidPasswordResetTokenException("Invalid OTP. Please try again."));

        if (passwordResetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(passwordResetToken);
            throw new ExpiredPasswordResetTokenException("OTP has expired. Please request a new code.");
        }

        if (!passwordResetToken.getToken().equals(request.getToken())) {
            int newAttempts = passwordResetToken.getAttempts() + 1;
            passwordResetToken.setAttempts(newAttempts);
            if (newAttempts >= MAX_ATTEMPTS) {
                passwordResetTokenRepository.delete(passwordResetToken);
                throw new InvalidPasswordResetTokenException("Too many failed attempts. Please request a new OTP code.");
            }
            passwordResetTokenRepository.save(passwordResetToken);
            throw new InvalidPasswordResetTokenException("Invalid OTP. Please try again.");
        }

        // Validate password confirmation match
        if (request.getNewPassword() == null || !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordResetMismatchException("Passwords do not match.");
        }

        // Validate strict password strength policy
        PasswordPolicyValidator.validate(request.getNewPassword());

        // Validate new password is not identical to current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetTokenRepository.delete(passwordResetToken);

        return "Password has been reset successfully";
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase();
    }

    public static class InvalidPasswordResetTokenException extends IllegalArgumentException {

        public InvalidPasswordResetTokenException(String message) {
            super(message);
        }
    }

    public static class ExpiredPasswordResetTokenException extends IllegalArgumentException {

        public ExpiredPasswordResetTokenException(String message) {
            super(message);
        }
    }

    public static class PasswordResetMismatchException extends IllegalArgumentException {

        public PasswordResetMismatchException(String message) {
            super(message);
        }
    }
}
