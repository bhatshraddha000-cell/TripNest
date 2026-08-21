package com.tripnest.tripnest.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.CreateTripRequest;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.dto.UpdateTripRequest;
import com.tripnest.tripnest.exception.TripCapacityException;
import com.tripnest.tripnest.exception.TripNotFoundException;
import com.tripnest.tripnest.exception.TripOverlapException;
import com.tripnest.tripnest.exception.TripValidationException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripInvitationRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.DocumentRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripReminderRepository;
import com.tripnest.tripnest.model.Itinerary;

import lombok.RequiredArgsConstructor;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final TripMemberRepository tripMemberRepository;
    private final TripInvitationRepository tripInvitationRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final DocumentRepository documentRepository;
    private final com.tripnest.tripnest.repository.TripChatMessageRepository tripChatMessageRepository;
    private final ItineraryRepository itineraryRepository;
    private final TripReminderRepository tripReminderRepository;


    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private TripMember getMemberOrOwnerAsAdmin(Long tripId, User user) {
        Optional<TripMember> membershipOpt = tripMemberRepository.findByTripIdAndUserId(tripId, user.getId());
        if (membershipOpt.isPresent()) {
            return membershipOpt.get();
        }
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new TripNotFoundException("Trip not found"));
        if (trip.getUser().getId().equals(user.getId())) {
            TripMember member = TripMember.builder()
                    .trip(trip)
                    .user(user)
                    .tripRole(TripMemberRole.GROUP_ADMIN)
                    .build();
            return tripMemberRepository.save(member);
        }
        throw new TripNotFoundException("Trip not found");
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
        if (request.getTravelers() == null || request.getTravelers() < 1) {
            throw new TripValidationException("Number of travelers must be at least 1");
        }
        validateDates(request.getStartDate(), request.getEndDate());
        if (tripRepository.existsOverlappingTripForUser(user, request.getStartDate(), request.getEndDate())) {
            throw new TripOverlapException("Trip dates overlap with an existing trip. Please choose a different date range.");
        }

        Trip trip = Trip.builder()
                .title(request.getTitle())
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .travelers(request.getTravelers())
                .budget(request.getBudget())
                .status(request.getStatus() != null ? request.getStatus() : TripStatus.PLANNING)
                .description(request.getDescription())
                .user(user)
                .build();

        Trip saved = tripRepository.save(trip);
        
        // Auto-create GROUP_ADMIN trip member record
        TripMember adminMember = TripMember.builder()
                .trip(saved)
                .user(user)
                .tripRole(TripMemberRole.GROUP_ADMIN)
                .build();
        tripMemberRepository.save(adminMember);

        activityLogService.logActivity(user, "TRIP", saved.getId(), "CREATED", "Trip Created", "Created trip \"" + saved.getTitle() + "\"");
        
        TripResponse resp = mapToResponse(saved);
        resp.setTripRole(TripMemberRole.GROUP_ADMIN.name());
        return resp;
    }

    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        User user = getAuthenticatedUser();

        List<TripMember> memberships = tripMemberRepository.findByUser(user);
        return memberships.stream()
                .map(membership -> {
                    TripResponse resp = mapToResponse(membership.getTrip());
                    resp.setTripRole(membership.getTripRole().name());
                    return resp;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TripResponse> searchTrips(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        String cleanQuery = query.trim().toLowerCase();
        User user = getAuthenticatedUser();
        List<TripMember> memberships = tripMemberRepository.findByUser(user);
        return memberships.stream()
                .filter(m -> {
                    Trip t = m.getTrip();
                    return (t.getTitle() != null && t.getTitle().toLowerCase().contains(cleanQuery))
                        || (t.getDestination() != null && t.getDestination().toLowerCase().contains(cleanQuery))
                        || (t.getStatus() != null && t.getStatus().name().toLowerCase().contains(cleanQuery));
                })
                .map(m -> {
                    TripResponse resp = mapToResponse(m.getTrip());
                    resp.setTripRole(m.getTripRole().name());
                    return resp;
                })
                .toList();
    }

    @Transactional
    public TripResponse getTripById(Long id) {
        User user = getAuthenticatedUser();
        TripMember membership = getMemberOrOwnerAsAdmin(id, user);
        TripResponse resp = mapToResponse(membership.getTrip());
        resp.setTripRole(membership.getTripRole().name());
        return resp;
    }

    @Transactional
    public TripResponse updateTrip(Long id, UpdateTripRequest request) {
        User user = getAuthenticatedUser();
        TripMember membership = getMemberOrOwnerAsAdmin(id, user);

        if (membership.getTripRole() != TripMemberRole.GROUP_ADMIN) {
            throw new IllegalArgumentException("Only Group Admin can edit the trip");
        }

        Trip trip = membership.getTrip();
        if (request.getTravelers() == null || request.getTravelers() < 1) {
            throw new TripValidationException("Number of travelers must be at least 1");
        }
        long currentMembers = tripMemberRepository.countByTripId(id);
        if (request.getTravelers() < currentMembers) {
            throw new TripCapacityException("You cannot reduce the trip capacity below the current number of travelers (" + currentMembers + ").");
        }
        validateDates(request.getStartDate(), request.getEndDate());
        if (tripRepository.existsOverlappingTripForUserExcludingTrip(user, trip.getId(), request.getStartDate(), request.getEndDate())) {
            throw new TripOverlapException("Trip dates overlap with an existing trip. Please choose a different date range.");
        }

        trip.setTitle(request.getTitle());
        trip.setDestination(request.getDestination());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setTravelers(request.getTravelers());
        trip.setBudget(request.getBudget());
        trip.setStatus(request.getStatus());
        trip.setDescription(request.getDescription());

        Trip saved = tripRepository.save(trip);
        activityLogService.logActivity(user, "TRIP", saved.getId(), "UPDATED", "Trip Updated", "Updated trip \"" + saved.getTitle() + "\"");
        
        TripResponse resp = mapToResponse(saved);
        resp.setTripRole(membership.getTripRole().name());
        return resp;
    }

    @Transactional
    public void deleteTrip(Long id) {
        User user = getAuthenticatedUser();
        TripMember membership = getMemberOrOwnerAsAdmin(id, user);

        if (membership.getTripRole() != TripMemberRole.GROUP_ADMIN) {
            throw new IllegalArgumentException("Only Group Admin can delete the trip");
        }

        Trip trip = membership.getTrip();
        String tripTitle = trip.getTitle();
        Long tripId = trip.getId();

        // Clean up all dependent associations before deletion
        expenseSplitRepository.deleteByExpenseTripId(tripId);
        expenseRepository.deleteByTripId(tripId);
        tripMemberRepository.deleteByTripId(tripId);
        tripInvitationRepository.deleteByTripId(tripId);
        documentRepository.deleteByTripId(tripId);
        tripChatMessageRepository.deleteByTripId(tripId);
        tripReminderRepository.deleteByTripId(tripId);

        // Delete associated itinerary days (which cascades to child activities via JPA orphanRemoval/cascade)
        List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDateAscDayNumberAsc(tripId);
        if (!itineraries.isEmpty()) {
            itineraryRepository.deleteAll(itineraries);
        }

        tripRepository.delete(trip);
        activityLogService.logActivity(user, "TRIP", tripId, "DELETED", "Trip Deleted", "Deleted trip \"" + tripTitle + "\"");
    }
    
}
