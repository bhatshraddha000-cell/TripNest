package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.CreateActivityRequest;
import com.tripnest.tripnest.dto.ActivityResponse;
import com.tripnest.tripnest.dto.UpdateActivityRequest;
import com.tripnest.tripnest.exception.TripNotFoundException;
import com.tripnest.tripnest.exception.TripValidationException;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ItineraryRepository itineraryRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Itinerary getAuthenticatedItinerary(Long tripId, Long itineraryId, User user) {
        // verify trip ownership
        tripRepository.findByIdAndUser(tripId, user)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));

        // verify itinerary belongs to trip
        return itineraryRepository.findByIdAndTripId(itineraryId, tripId)
                .orElseThrow(() -> new TripNotFoundException("Itinerary not found"));
    }

    private void validateTimes(java.time.LocalTime startTime, java.time.LocalTime endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new TripValidationException("End time cannot be before start time");
        }
    }

    private ActivityResponse mapToResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .itineraryId(activity.getItinerary().getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .activityType(activity.getActivityType())
                .estimatedCost(activity.getEstimatedCost())
                .notes(activity.getNotes())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }

    @Transactional
    public ActivityResponse createActivity(Long tripId, Long itineraryId, CreateActivityRequest request) {
        User user = getAuthenticatedUser();
        Itinerary itinerary = getAuthenticatedItinerary(tripId, itineraryId, user);

        validateTimes(request.getStartTime(), request.getEndTime());

        Activity activity = Activity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .activityType(request.getActivityType())
                .estimatedCost(request.getEstimatedCost())
                .notes(request.getNotes())
                .itinerary(itinerary)
                .build();

        Activity saved = activityRepository.save(activity);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getAllActivities(Long tripId, Long itineraryId) {
        User user = getAuthenticatedUser();
        getAuthenticatedItinerary(tripId, itineraryId, user); // verifies ownership and binding

        List<Activity> activities = activityRepository.findByItineraryIdOrderByStartTimeAsc(itineraryId);
        return activities.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(Long tripId, Long itineraryId, Long activityId) {
        User user = getAuthenticatedUser();
        getAuthenticatedItinerary(tripId, itineraryId, user); // verifies ownership and binding

        Activity activity = activityRepository.findByIdAndItineraryId(activityId, itineraryId)
                .orElseThrow(() -> new TripNotFoundException("Activity not found"));

        return mapToResponse(activity);
    }

    @Transactional
    public ActivityResponse updateActivity(Long tripId, Long itineraryId, Long activityId, UpdateActivityRequest request) {
        User user = getAuthenticatedUser();
        getAuthenticatedItinerary(tripId, itineraryId, user); // verifies ownership and binding

        Activity activity = activityRepository.findByIdAndItineraryId(activityId, itineraryId)
                .orElseThrow(() -> new TripNotFoundException("Activity not found"));

        validateTimes(request.getStartTime(), request.getEndTime());

        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setLocation(request.getLocation());
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setActivityType(request.getActivityType());
        activity.setEstimatedCost(request.getEstimatedCost());
        activity.setNotes(request.getNotes());

        Activity saved = activityRepository.save(activity);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteActivity(Long tripId, Long itineraryId, Long activityId) {
        User user = getAuthenticatedUser();
        getAuthenticatedItinerary(tripId, itineraryId, user); // verifies ownership and binding

        Activity activity = activityRepository.findByIdAndItineraryId(activityId, itineraryId)
                .orElseThrow(() -> new TripNotFoundException("Activity not found"));

        activityRepository.delete(activity);
    }
}
