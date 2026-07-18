package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.ActivityResponse;
import com.tripnest.tripnest.dto.CreateItineraryRequest;
import com.tripnest.tripnest.dto.ItineraryResponse;
import com.tripnest.tripnest.dto.UpdateItineraryRequest;
import com.tripnest.tripnest.exception.TripNotFoundException;
import com.tripnest.tripnest.exception.TripValidationException;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItineraryService {

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

    private Trip getAuthenticatedTrip(Long tripId, User user) {
        return tripRepository.findByIdAndUser(tripId, user)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));
    }

    private void validateItineraryDate(Trip trip, java.time.LocalDate date) {
        if (date.isBefore(trip.getStartDate()) || date.isAfter(trip.getEndDate())) {
            throw new TripValidationException("Itinerary date must be between trip start and end dates");
        }
    }

    private ActivityResponse mapActivityToResponse(Activity activity) {
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

    private ItineraryResponse mapItineraryToResponse(Itinerary itinerary) {
        List<ActivityResponse> activityResponses = itinerary.getActivities() != null
                ? itinerary.getActivities().stream()
                        .sorted((a1, a2) -> {
                            if (a1.getStartTime() == null && a2.getStartTime() == null) return 0;
                            if (a1.getStartTime() == null) return 1;
                            if (a2.getStartTime() == null) return -1;
                            return a1.getStartTime().compareTo(a2.getStartTime());
                        })
                        .map(this::mapActivityToResponse)
                        .toList()
                : List.of();

        return ItineraryResponse.builder()
                .id(itinerary.getId())
                .dayNumber(itinerary.getDayNumber())
                .date(itinerary.getDate())
                .title(itinerary.getTitle())
                .notes(itinerary.getNotes())
                .tripId(itinerary.getTrip().getId())
                .createdAt(itinerary.getCreatedAt())
                .updatedAt(itinerary.getUpdatedAt())
                .activities(activityResponses)
                .build();
    }

    @Transactional
    public ItineraryResponse createItinerary(Long tripId, CreateItineraryRequest request) {
        User user = getAuthenticatedUser();
        Trip trip = getAuthenticatedTrip(tripId, user);

        validateItineraryDate(trip, request.getDate());

        if (itineraryRepository.existsByTripIdAndDayNumber(tripId, request.getDayNumber())) {
            throw new TripValidationException("Duplicate day number not allowed within the same trip");
        }

        if (itineraryRepository.existsByTripIdAndDate(tripId, request.getDate())) {
            throw new TripValidationException("Duplicate itinerary date not allowed within the same trip");
        }

        Itinerary itinerary = Itinerary.builder()
                .dayNumber(request.getDayNumber())
                .date(request.getDate())
                .title(request.getTitle())
                .notes(request.getNotes())
                .trip(trip)
                .build();

        Itinerary saved = itineraryRepository.save(itinerary);
        return mapItineraryToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ItineraryResponse> getAllItineraries(Long tripId) {
        User user = getAuthenticatedUser();
        getAuthenticatedTrip(tripId, user); // checks ownership

        List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDateAscDayNumberAsc(tripId);
        return itineraries.stream()
                .map(this::mapItineraryToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ItineraryResponse getItineraryById(Long tripId, Long itineraryId) {
        User user = getAuthenticatedUser();
        getAuthenticatedTrip(tripId, user); // checks ownership

        Itinerary itinerary = itineraryRepository.findByIdAndTripId(itineraryId, tripId)
                .orElseThrow(() -> new TripNotFoundException("Itinerary not found"));

        return mapItineraryToResponse(itinerary);
    }

    @Transactional
    public ItineraryResponse updateItinerary(Long tripId, Long itineraryId, UpdateItineraryRequest request) {
        User user = getAuthenticatedUser();
        Trip trip = getAuthenticatedTrip(tripId, user); // checks ownership

        Itinerary itinerary = itineraryRepository.findByIdAndTripId(itineraryId, tripId)
                .orElseThrow(() -> new TripNotFoundException("Itinerary not found"));

        validateItineraryDate(trip, request.getDate());

        if (!itinerary.getDayNumber().equals(request.getDayNumber()) 
                && itineraryRepository.existsByTripIdAndDayNumber(tripId, request.getDayNumber())) {
            throw new TripValidationException("Duplicate day number not allowed within the same trip");
        }

        if (!itinerary.getDate().equals(request.getDate()) 
                && itineraryRepository.existsByTripIdAndDate(tripId, request.getDate())) {
            throw new TripValidationException("Duplicate itinerary date not allowed within the same trip");
        }

        itinerary.setDayNumber(request.getDayNumber());
        itinerary.setDate(request.getDate());
        itinerary.setTitle(request.getTitle());
        itinerary.setNotes(request.getNotes());

        Itinerary saved = itineraryRepository.save(itinerary);
        return mapItineraryToResponse(saved);
    }

    @Transactional
    public void deleteItinerary(Long tripId, Long itineraryId) {
        User user = getAuthenticatedUser();
        getAuthenticatedTrip(tripId, user); // checks ownership

        Itinerary itinerary = itineraryRepository.findByIdAndTripId(itineraryId, tripId)
                .orElseThrow(() -> new TripNotFoundException("Itinerary not found"));

        itineraryRepository.delete(itinerary);
    }
}
