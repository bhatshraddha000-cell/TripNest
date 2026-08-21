package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.NotificationResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Notification;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.NotificationRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications() {
        User user = getAuthenticatedUser();
        List<Notification> notifications = notificationRepository.findByReceiverOrderByCreatedAtDesc(user);
        return notifications.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void markAsRead(Long id) {
        User user = getAuthenticatedUser();
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getReceiver().getId().equals(user.getId())) {
            throw new SecurityException("Access denied");
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead() {
        User user = getAuthenticatedUser();
        List<Notification> notifications = notificationRepository.findByReceiverOrderByCreatedAtDesc(user);
        for (Notification n : notifications) {
            if (!n.getIsRead()) {
                n.setIsRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createNotification(User receiver, String title, String message, String type) {
        Notification notification = Notification.builder()
                .receiver(receiver)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }
}
