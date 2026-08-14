package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.CreateChatMessageRequest;
import com.tripnest.tripnest.dto.TripChatMessageResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripChatMessage;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripChatMessageRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TripChatService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripChatMessageRepository tripChatMessageRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private void verifyTripMembership(Trip trip, User user) {
        boolean isMember = tripMemberRepository.existsByTripIdAndUserId(trip.getId(), user.getId());
        boolean isOwner = trip.getUser() != null && trip.getUser().getId().equals(user.getId());
        if (!isMember && !isOwner) {
            throw new SecurityException("You are not a member of this trip");
        }
    }

    @Transactional(readOnly = true)
    public List<TripChatMessageResponse> getTripMessages(Long tripId) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        verifyTripMembership(trip, user);

        List<TripChatMessage> messages = tripChatMessageRepository.findByTripIdOrderByCreatedAtAsc(tripId);
        return messages.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public TripChatMessageResponse sendMessage(Long tripId, CreateChatMessageRequest request) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        verifyTripMembership(trip, user);

        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        TripChatMessage chatMessage = TripChatMessage.builder()
                .trip(trip)
                .sender(user)
                .message(request.getMessage().trim())
                .build();

        TripChatMessage saved = tripChatMessageRepository.save(chatMessage);
        return mapToResponse(saved);
    }

    private TripChatMessageResponse mapToResponse(TripChatMessage msg) {
        return TripChatMessageResponse.builder()
                .id(msg.getId())
                .tripId(msg.getTrip().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .senderEmail(msg.getSender().getEmail())
                .senderProfileImage(msg.getSender().getProfileImage())
                .message(msg.getMessage())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
