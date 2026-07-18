package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.CreateTripRequest;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.dto.UpdateTripRequest;
import com.tripnest.tripnest.exception.TripNotFoundException;
import com.tripnest.tripnest.exception.TripValidationException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TripService {

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

    private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new TripValidationException("End date cannot be before start date");
        }
    }

    private TripResponse mapToResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .destination(trip.getDestination())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .travelers(trip.getTravelers())
                .budget(trip.getBudget())
                .status(trip.getStatus())
                .description(trip.getDescription())
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .ownerId(trip.getUser().getId())
                .build();
    }

    @Transactional
    public TripResponse createTrip(CreateTripRequest request) {
        User user = getAuthenticatedUser();
        validateDates(request.getStartDate(), request.getEndDate());

        Trip trip = Trip.builder()
                .title(request.getTitle())
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .travelers(request.getTravelers())
                .budget(request.getBudget())
                .status(TripStatus.PLANNING)
                .description(request.getDescription())
                .user(user)
                .build();

        Trip saved = tripRepository.save(trip);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        User user = getAuthenticatedUser();
        List<Trip> trips = tripRepository.findByUser(user);
        return trips.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripResponse getTripById(Long id) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));
        return mapToResponse(trip);
    }

    @Transactional
    public TripResponse updateTrip(Long id, UpdateTripRequest request) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));

        validateDates(request.getStartDate(), request.getEndDate());

        trip.setTitle(request.getTitle());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setTravelers(request.getTravelers());
        trip.setBudget(request.getBudget());
        trip.setStatus(request.getStatus());
        trip.setDescription(request.getDescription());

        Trip saved = tripRepository.save(trip);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteTrip(Long id) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));
        tripRepository.delete(trip);
    }
}
