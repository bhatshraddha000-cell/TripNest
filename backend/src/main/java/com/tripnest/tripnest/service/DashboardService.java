package com.tripnest.tripnest.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.ActivityLogResponse;
import com.tripnest.tripnest.dto.DashboardResponse;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private TripResponse mapToTripResponse(Trip trip) {
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

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData() {
        User user = getAuthenticatedUser();
        List<Trip> allTrips = tripRepository.findByUser(user);
        LocalDate today = LocalDate.now();

        long totalTrips = allTrips.size();
        double totalBudget = allTrips.stream()
                .mapToDouble(t -> t.getBudget() != null ? t.getBudget() : 0.0)
                .sum();

        List<TripResponse> upcomingTrips = allTrips.stream()
                .filter(t -> t.getStartDate() != null && !t.getStartDate().isBefore(today))
                .filter(t -> t.getStatus() != TripStatus.COMPLETED && t.getStatus() != TripStatus.CANCELLED)
                .sorted(Comparator.comparing(Trip::getStartDate))
                .map(this::mapToTripResponse)
                .toList();

        long upcomingTripsCount = upcomingTrips.size();

        List<ActivityLogResponse> recentActivities = activityLogService.getDashboardActivities(user);

        return DashboardResponse.builder()
                .totalTrips(totalTrips)
                .upcomingTripsCount(upcomingTripsCount)
                .totalBudget(totalBudget)
                .upcomingTrips(upcomingTrips)
                .recentActivities(recentActivities)
                .build();
    }
}
