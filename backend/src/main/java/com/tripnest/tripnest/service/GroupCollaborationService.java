package com.tripnest.tripnest.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.InviteMemberRequest;
import com.tripnest.tripnest.dto.TripInvitationResponse;
import com.tripnest.tripnest.dto.TripMemberResponse;
import com.tripnest.tripnest.exception.TripCapacityException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripInvitation;
import com.tripnest.tripnest.model.TripInvitationStatus;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripInvitationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GroupCollaborationService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripInvitationRepository tripInvitationRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public TripInvitationResponse inviteMember(Long tripId, InviteMemberRequest request) {
        User sender = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        // Verify sender is Group Admin
        TripMember senderMembership = tripMemberRepository.findByTripIdAndUserId(tripId, sender.getId())
                .orElseThrow(() -> new SecurityException("You are not a member of this trip"));
        if (senderMembership.getTripRole() != TripMemberRole.GROUP_ADMIN) {
            throw new SecurityException("Only Group Admin can invite members");
        }

        // Check maximum capacity
        int maxCapacity = trip.getTravelers() != null ? trip.getTravelers() : 1;
        long currentMembers = tripMemberRepository.countByTripId(tripId);
        long pendingInvites = tripInvitationRepository.countByTripIdAndStatus(tripId, TripInvitationStatus.PENDING);
        if ((currentMembers + pendingInvites) >= maxCapacity) {
            throw new TripCapacityException("This trip has reached its maximum capacity of " + maxCapacity + " travelers.");
        }

        // Find receiver
        String emailOrUsername = request.getEmailOrUsername().trim();
        User receiver = userRepository.findByEmail(emailOrUsername)
                .or(() -> {
                    // Try looking up by fullName (username)
                    List<User> list = userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(emailOrUsername, emailOrUsername);
                    return list.stream()
                            .filter(u -> u.getFullName().equalsIgnoreCase(emailOrUsername))
                            .findFirst();
                })
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + emailOrUsername));

        // Check if receiver is the sender
        if (receiver.getId().equals(sender.getId())) {
            throw new IllegalArgumentException("You cannot invite yourself");
        }

        // Check if already a member
        if (tripMemberRepository.existsByTripIdAndUserId(tripId, receiver.getId())) {
            throw new IllegalArgumentException("User is already a member of this trip");
        }

        // Check if there is already a pending invitation
        Optional<TripInvitation> existingInv = tripInvitationRepository.findByTripIdAndReceiverIdAndStatus(tripId, receiver.getId(), TripInvitationStatus.PENDING);
        if (existingInv.isPresent()) {
            throw new IllegalArgumentException("Invitation is already pending for this user");
        }

        TripInvitation invitation = TripInvitation.builder()
                .trip(trip)
                .sender(sender)
                .receiver(receiver)
                .status(TripInvitationStatus.PENDING)
                .build();

        TripInvitation saved = tripInvitationRepository.save(invitation);

        // Generate notification
        String msg = sender.getFullName() + " invited you to join " + trip.getTitle();
        notificationService.createNotification(receiver, "Trip Invitation", msg, "TRIP_INVITATION");

        return TripInvitationResponse.builder()
                .id(saved.getId())
                .tripId(trip.getId())
                .tripTitle(trip.getTitle())
                .senderName(sender.getFullName())
                .status(saved.getStatus().name())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TripMemberResponse> getTripMembers(Long tripId) {
        User user = getAuthenticatedUser();
        // Verify current user has access to trip (is member or legacy owner)
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new IllegalArgumentException("Trip not found"));
            if (!trip.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Access denied to trip members list");
            }
        }

        List<TripMember> members = tripMemberRepository.findByTripId(tripId);
        return members.stream().map(m -> TripMemberResponse.builder()
                .userId(m.getUser().getId())
                .fullName(m.getUser().getFullName())
                .email(m.getUser().getEmail())
                .profileImage(m.getUser().getProfileImage())
                .tripRole(m.getTripRole().name())
                .joinedAt(m.getJoinedAt())
                .build()
        ).toList();
    }

    @Transactional
    public void acceptInvitation(Long invitationId) {
        User receiver = getAuthenticatedUser();
        TripInvitation invitation = tripInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (!invitation.getReceiver().getId().equals(receiver.getId())) {
            throw new SecurityException("Access denied: This invitation is not for you");
        }

        if (invitation.getStatus() != TripInvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is already " + invitation.getStatus());
        }

        Trip trip = invitation.getTrip();
        int maxCapacity = trip.getTravelers() != null ? trip.getTravelers() : 1;
        long currentMembers = tripMemberRepository.countByTripId(trip.getId());
        if (currentMembers >= maxCapacity) {
            throw new TripCapacityException("This trip has reached its maximum capacity of " + maxCapacity + " travelers.");
        }

        invitation.setStatus(TripInvitationStatus.ACCEPTED);
        tripInvitationRepository.save(invitation);

        // Add user as MEMBER
        TripMember member = TripMember.builder()
                .trip(invitation.getTrip())
                .user(receiver)
                .tripRole(TripMemberRole.MEMBER)
                .build();
        tripMemberRepository.save(member);

        // Notify other members
        List<TripMember> existingMembers = tripMemberRepository.findByTripId(invitation.getTrip().getId());
        String msg = receiver.getFullName() + " joined " + invitation.getTrip().getTitle();
        for (TripMember m : existingMembers) {
            if (!m.getUser().getId().equals(receiver.getId())) {
                notificationService.createNotification(m.getUser(), "Member Joined", msg, "MEMBER_JOINED");
            }
        }

        activityLogService.logActivity(receiver, "TRIP", invitation.getTrip().getId(), "JOINED", "Member Joined", receiver.getFullName() + " joined the trip");
    }

    @Transactional
    public void rejectInvitation(Long invitationId) {
        User receiver = getAuthenticatedUser();
        TripInvitation invitation = tripInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (!invitation.getReceiver().getId().equals(receiver.getId())) {
            throw new SecurityException("Access denied: This invitation is not for you");
        }

        if (invitation.getStatus() != TripInvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is already " + invitation.getStatus());
        }

        invitation.setStatus(TripInvitationStatus.REJECTED);
        tripInvitationRepository.save(invitation);

        // Notify inviter (sender) that invitation was rejected
        User inviter = invitation.getSender();
        if (inviter != null) {
            String msg = receiver.getFullName() + " rejected your invitation to join " + invitation.getTrip().getTitle() + ".";
            notificationService.createNotification(inviter, "Trip invitation rejected", msg, "INVITATION_REJECTED");
        }

        activityLogService.logActivity(receiver, "TRIP", invitation.getTrip().getId(), "INVITATION_REJECTED", "Trip invitation rejected", receiver.getFullName() + " rejected invitation to join " + invitation.getTrip().getTitle());
    }

    @Transactional
    public void removeMember(Long tripId, Long userId) {
        User admin = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        // Verify admin is Group Admin
        TripMember adminMembership = tripMemberRepository.findByTripIdAndUserId(tripId, admin.getId())
                .orElseThrow(() -> new SecurityException("You are not a member of this trip"));
        if (adminMembership.getTripRole() != TripMemberRole.GROUP_ADMIN) {
            throw new SecurityException("Only Group Admin can remove members");
        }

        if (admin.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot remove yourself");
        }

        TripMember toRemove = tripMemberRepository.findByTripIdAndUserId(tripId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this trip"));

        tripMemberRepository.delete(toRemove);

        // Notify the removed member
        String msg = "You have been removed from " + trip.getTitle();
        notificationService.createNotification(toRemove.getUser(), "Member Removed", msg, "MEMBER_REMOVED");

        activityLogService.logActivity(admin, "TRIP", tripId, "MEMBER_REMOVED", "Member Removed", "Removed " + toRemove.getUser().getFullName() + " from the trip");
    }

    @Transactional(readOnly = true)
    public List<TripInvitationResponse> getPendingInvitations() {
        User user = getAuthenticatedUser();
        List<TripInvitation> invitations = tripInvitationRepository.findByReceiverAndStatusOrderByCreatedAtDesc(user, TripInvitationStatus.PENDING);
        return invitations.stream().map(inv -> TripInvitationResponse.builder()
                .id(inv.getId())
                .tripId(inv.getTrip().getId())
                .tripTitle(inv.getTrip().getTitle())
                .senderName(inv.getSender().getFullName())
                .status(inv.getStatus().name())
                .createdAt(inv.getCreatedAt())
                .build()
        ).toList();
    }
}
