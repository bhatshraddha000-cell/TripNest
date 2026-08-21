package com.tripnest.tripnest.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.ResetPasswordRequest;
import com.tripnest.tripnest.model.PasswordResetToken;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final String PASSWORD_RESET_SUCCESS_MESSAGE =
            "If an account exists for that email, password reset instructions have been sent.";
    private static final int PASSWORD_RESET_EXPIRATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public String forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);
        final StringBuilder tokenHolder = new StringBuilder();

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            passwordResetTokenRepository.findByUser(user)
                    .ifPresent(passwordResetTokenRepository::delete);

            // Generate a unique 6-digit numeric OTP code among active tokens
            String token;
            do {
                token = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
            } while (passwordResetTokenRepository.findByToken(token).isPresent());

            PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                    .token(token)
                    .expiryDate(LocalDateTime.now().plusMinutes(PASSWORD_RESET_EXPIRATION_MINUTES))
                    .user(user)
                    .build();

            passwordResetTokenRepository.save(passwordResetToken);
            emailService.sendPasswordResetOtpEmail(user, token);
            tokenHolder.append(token);
        });

        return tokenHolder.toString();
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidPasswordResetTokenException("Invalid email or OTP code"));

        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByUser(user)
                .orElseThrow(() -> new InvalidPasswordResetTokenException("No password reset requested or OTP is invalid"));

        if (!passwordResetToken.getToken().equals(request.getToken())) {
            throw new InvalidPasswordResetTokenException("Invalid OTP code");
        }

        if (passwordResetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(passwordResetToken);
            throw new ExpiredPasswordResetTokenException("OTP code has expired");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordResetMismatchException("New password and confirm password do not match");
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
