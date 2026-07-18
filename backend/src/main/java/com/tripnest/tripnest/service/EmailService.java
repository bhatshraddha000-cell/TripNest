package com.tripnest.tripnest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.tripnest.tripnest.model.User;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    public void sendPasswordResetEmail(User user, String token) {
        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        String subject = "Reset your TripNest password";
        String htmlContent = buildPasswordResetEmail(user.getFullName(), resetLink);

        log.info("=========================================");
        log.info("PASSWORD RESET LINK GENERATED FOR USER: {}", user.getEmail());
        log.info("Reset Link: {}", resetLink);
        log.info("=========================================");

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Password reset email sent successfully to {}", user.getEmail());
        } catch (Exception exception) {
            log.warn("Failed to send password reset email to {} via SMTP: {}. Reset link was logged above.",
                    user.getEmail(), exception.getMessage());
        }
    }

    private String buildPasswordResetEmail(String fullName, String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background-color:#f6f8fb;font-family:Arial,sans-serif;color:#1f2937;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:#f6f8fb;padding:32px 0;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
                                    <tr>
                                        <td>
                                            <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Reset your password</h1>
                                            <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hello %s,</p>
                                            <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">
                                                We received a request to reset the password for your TripNest account.
                                            </p>
                                            <p style="margin:0 0 24px;text-align:center;">
                                                <a href="%s" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:16px;font-weight:bold;">
                                                    Reset Password
                                                </a>
                                            </p>
                                            <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#4b5563;">
                                                This password reset link will expire in 15 minutes.
                                            </p>
                                            <p style="margin:0;font-size:14px;line-height:1.5;color:#4b5563;">
                                                If you did not request a password reset, you can safely ignore this email.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(escapeHtml(fullName), escapeHtml(resetLink));
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
