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

    public void sendPasswordResetOtpEmail(User user, String otp) {
        String subject = "Your TripNest Password Reset Code: " + otp;
        String htmlContent = buildPasswordResetOtpEmail(user.getFullName(), otp);

        log.info("=========================================");
        log.info("PASSWORD RESET OTP GENERATED FOR USER: {}", user.getEmail());
        log.info("OTP Code: {}", otp);
        log.info("=========================================");

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Password reset OTP email sent successfully to {}", user.getEmail());
        } catch (Exception exception) {
            log.warn("Failed to send password reset OTP email to {} via SMTP: {}. OTP code was logged above.",
                    user.getEmail(), exception.getMessage());
        }
    }

    private String buildPasswordResetOtpEmail(String fullName, String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background-color:#f6f8fb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:#f6f8fb;padding:48px 0;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                                    <tr>
                                        <td>
                                            <div style="text-align: center; margin-bottom: 24px;">
                                                <span style="font-size: 28px; font-weight: 800; color: #eb5e28; letter-spacing: -0.5px;">TripNest</span>
                                            </div>
                                            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;text-align:center;">Password Reset Request</h1>
                                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;">Hello %s,</p>
                                            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                                                We received a request to reset the password for your TripNest account. Please use the following 6-digit verification code (OTP) to complete the process.
                                            </p>
                                            <div style="margin:0 0 28px;text-align:center;">
                                                <div style="display:inline-block;background-color:#f3f4f6;color:#111827;font-size:32px;font-weight:800;letter-spacing:6px;padding:16px 32px;border-radius:8px;border:1px solid #e5e7eb;font-family:monospace;">
                                                    %s
                                                </div>
                                            </div>
                                            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;text-align:center;">
                                                This code is valid for <strong>15 minutes</strong>. Do not share this OTP with anyone.
                                            </p>
                                            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                                            <p style="margin:0;font-size:13px;line-height:1.5;color:#9ca3af;text-align:center;">
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
                """.formatted(escapeHtml(fullName), escapeHtml(otp));
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
