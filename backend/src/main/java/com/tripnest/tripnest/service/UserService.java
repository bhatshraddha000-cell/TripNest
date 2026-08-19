package com.tripnest.tripnest.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.tripnest.tripnest.dto.DeleteAccountRequest;
import com.tripnest.tripnest.dto.UpdateProfileRequest;
import com.tripnest.tripnest.dto.UserProfileResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.FeedbackRepository;
import com.tripnest.tripnest.repository.NotificationRepository;
import com.tripnest.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.tripnest.repository.TripChatMessageRepository;
import com.tripnest.tripnest.repository.TripInvitationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationRepository notificationRepository;
    private final FeedbackRepository feedbackRepository;
    private final TripChatMessageRepository tripChatMessageRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final TripInvitationRepository tripInvitationRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripRepository tripRepository;
    private final TripService tripService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("Authenticated user not found");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        Set<String> roleSet = user.getRoles().stream()
                .map(role -> role.getName().name().replace("ROLE_", ""))
                .collect(Collectors.toSet());

        String mainRole = roleSet.stream().findFirst().orElse("Traveler");
        String memberSinceStr = user.getCreatedAt() != null
                ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy"))
                : "Recent traveler";

        return UserProfileResponse.builder()
                .userId(user.getId())
                .name(user.getFullName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .profileImage(user.getProfileImage())
                .role(mainRole)
                .roles(roleSet)
                .createdAt(user.getCreatedAt())
                .memberSince(memberSinceStr)
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = getAuthenticatedUser();
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateUserProfile(UpdateProfileRequest request) {
        User user = getAuthenticatedUser();

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage());
        }

        User saved = userRepository.save(user);
        return mapToProfileResponse(saved);
    }

    @Transactional
    public UserProfileResponse uploadProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image file to upload.");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        String lowerName = originalFilename != null ? originalFilename.toLowerCase() : "";

        boolean isValidExtension = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png") || lowerName.endsWith(".webp");
        boolean isValidMime = contentType != null && (
                contentType.equalsIgnoreCase("image/jpeg") ||
                contentType.equalsIgnoreCase("image/png") ||
                contentType.equalsIgnoreCase("image/webp")
        );

        if (!isValidExtension && !isValidMime) {
            throw new IllegalArgumentException("Invalid file format. Only JPG, PNG, and WEBP image files are allowed.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 5MB.");
        }

        User user = getAuthenticatedUser();

        if (user.getProfileImage() != null) {
            fileStorageService.deleteProfilePhoto(user.getProfileImage());
        }

        String imagePath = fileStorageService.storeProfilePhoto(file);
        user.setProfileImage(imagePath);

        User saved = userRepository.save(user);
        return mapToProfileResponse(saved);
    }

    @Transactional
    public UserProfileResponse removeProfilePhoto() {
        User user = getAuthenticatedUser();

        if (user.getProfileImage() != null) {
            fileStorageService.deleteProfilePhoto(user.getProfileImage());
            user.setProfileImage(null);
        }

        User saved = userRepository.save(user);
        return mapToProfileResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        String q = query.trim();
        return userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(q, q).stream()
                .map(this::mapToProfileResponse)
                .toList();
    }

    @Transactional
    public void deleteCurrentUserAccount(DeleteAccountRequest request) {
        User user = getAuthenticatedUser();

        // System Administrator Protection
        boolean isAdmin = user.getEmail().equalsIgnoreCase("admin@tripnest.com") ||
                user.getRoles().stream().anyMatch(role -> "ROLE_ADMIN".equals(role.getName().name()));
        if (isAdmin) {
            throw new IllegalArgumentException("System Administrator account cannot be deleted.");
        }

        // Password Verification
        if (request.getPassword() == null || request.getPassword().trim().isEmpty() ||
                !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password. Account deletion canceled.");
        }

        Long userId = user.getId();

        // Delete profile photo from storage if exists
        if (user.getProfileImage() != null) {
            try {
                fileStorageService.deleteProfilePhoto(user.getProfileImage());
            } catch (Exception ignored) {}
        }

        // Delete tokens, logs, notifications, feedback
        passwordResetTokenRepository.findByUser(user).ifPresent(passwordResetTokenRepository::delete);
        activityLogRepository.deleteByUser(user);
        notificationRepository.deleteByReceiver(user);
        feedbackRepository.deleteByUser(user);

        // Delete chat messages sent by user & expense splits for user
        expenseSplitRepository.deleteByUserId(userId);
        tripChatMessageRepository.deleteBySenderId(userId);

        // Delete trip invitations involving user
        tripInvitationRepository.deleteByReceiver(user);
        tripInvitationRepository.deleteBySender(user);

        // Delete trip memberships and owned trips
        List<TripMember> memberships = tripMemberRepository.findByUser(user);
        for (TripMember membership : memberships) {
            Trip trip = membership.getTrip();
            if (trip.getUser().getId().equals(userId) || membership.getTripRole() == TripMemberRole.GROUP_ADMIN) {
                if (tripRepository.existsById(trip.getId())) {
                    tripService.deleteTrip(trip.getId());
                }
            } else {
                tripMemberRepository.delete(membership);
            }
        }

        // Delete any remaining owned trips
        List<Trip> ownedTrips = tripRepository.findByUser(user);
        for (Trip ownedTrip : ownedTrips) {
            if (tripRepository.existsById(ownedTrip.getId())) {
                tripService.deleteTrip(ownedTrip.getId());
            }
        }

        // Delete user entity
        userRepository.delete(user);
    }
}
