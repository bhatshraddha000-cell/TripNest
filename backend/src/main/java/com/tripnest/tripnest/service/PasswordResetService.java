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

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            passwordResetTokenRepository.findByUser(user)
                    .ifPresent(passwordResetTokenRepository::delete);

            String token = UUID.randomUUID().toString();
            PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                    .token(token)
                    .expiryDate(LocalDateTime.now().plusMinutes(PASSWORD_RESET_EXPIRATION_MINUTES))
                    .user(user)
                    .build();

            passwordResetTokenRepository.save(passwordResetToken);
            emailService.sendPasswordResetEmail(user, token);
        });

        return PASSWORD_RESET_SUCCESS_MESSAGE;
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new InvalidPasswordResetTokenException("Password reset token is invalid"));

        if (passwordResetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(passwordResetToken);
            throw new ExpiredPasswordResetTokenException("Password reset token has expired");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordResetMismatchException("New password and confirm password do not match");
        }

        User user = passwordResetToken.getUser();
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
