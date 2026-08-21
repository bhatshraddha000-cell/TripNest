package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tripnest.tripnest.dto.CreateFeedbackRequest;
import com.tripnest.tripnest.dto.FeedbackResponse;
import com.tripnest.tripnest.model.Feedback;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.FeedbackRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getRecentFeedback() {
        List<Feedback> recentFeedbacks = feedbackRepository.findTop3ByOrderByCreatedAtDesc();
        return recentFeedbacks.stream()
                .map(f -> FeedbackResponse.builder()
                        .id(f.getId())
                        .message(f.getMessage())
                        .userName(f.getUser() != null && f.getUser().getFullName() != null ? f.getUser().getFullName() : "Anonymous Traveler")
                        .createdAt(f.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public FeedbackResponse submitFeedback(CreateFeedbackRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address is required.");
        }

        String rawMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        if (rawMessage.length() < 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feedback message must be at least 5 characters long.");
        }
        if (rawMessage.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feedback message cannot exceed 1000 characters.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only registered TripNest users can submit feedback."));

        Feedback feedback = Feedback.builder()
                .user(user)
                .message(rawMessage)
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        log.info("Saved user feedback ID {} for user {}", saved.getId(), user.getEmail());

        return FeedbackResponse.builder()
                .id(saved.getId())
                .message(saved.getMessage())
                .userName(user.getFullName())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
