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
import com.tripnest.tripnest.dto.NotificationResponse;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.Notification;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.NotificationRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;
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

    @Transactional
    public DashboardResponse getDashboardData() {
        User user = getAuthenticatedUser();
        
        // Legacy migration check: ensure owned trips have TripMember record
        List<Trip> ownedTrips = tripRepository.findByUser(user);
        for (Trip trip : ownedTrips) {
            if (tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId()).isEmpty()) {
                TripMember member = TripMember.builder()
                        .trip(trip)
                        .user(user)
                        .tripRole(TripMemberRole.GROUP_ADMIN)
                        .build();
                tripMemberRepository.save(member);
            }
        }

        List<TripMember> memberships = tripMemberRepository.findByUser(user);
        List<Trip> allTrips = memberships.stream()
                .map(TripMember::getTrip)
                .toList();
        LocalDate today = LocalDate.now();

        long totalTrips = allTrips.size();
        double totalBudget = allTrips.stream()
                .mapToDouble(t -> t.getBudget() != null ? t.getBudget() : 0.0)
                .sum();

        List<Expense> expenses = allTrips.isEmpty() ? List.of() : expenseRepository.findByTripIn(allTrips);
        double totalExpenses = expenses.stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();

        double remainingBudget = totalBudget - totalExpenses;
        double budgetPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100.0 : 0.0;

        // Determine currently traveling trip: startDate <= today <= endDate
        List<Trip> activeTrips = allTrips.stream()
                .filter(t -> t.getStartDate() != null && t.getEndDate() != null)
                .filter(t -> !t.getStartDate().isAfter(today) && !t.getEndDate().isBefore(today))
                .filter(t -> t.getStatus() != TripStatus.CANCELLED)
                .sorted(Comparator.comparing(Trip::getStartDate).reversed()
                        .thenComparing(Comparator.comparing(Trip::getId).reversed()))
                .toList();

        Trip currentTrip = activeTrips.isEmpty() ? null : activeTrips.get(0);

        DashboardResponse.DashboardBudgetSummary budgetSummary;

        if (currentTrip != null) {
            double currentTripBudget = currentTrip.getBudget() != null ? currentTrip.getBudget() : 0.0;
            double currentTripSpent = expenses.stream()
                    .filter(e -> e.getTrip() != null && e.getTrip().getId().equals(currentTrip.getId()))
                    .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                    .sum();
            double currentTripRemaining = currentTripBudget - currentTripSpent;
            double currentTripPercentage = currentTripBudget > 0 ? (currentTripSpent / currentTripBudget) * 100.0 : 0.0;

            budgetSummary = DashboardResponse.DashboardBudgetSummary.builder()
                    .mode("CURRENT_TRIP")
                    .tripId(currentTrip.getId())
                    .destination(currentTrip.getDestination())
                    .totalBudget(currentTripBudget)
                    .spent(currentTripSpent)
                    .remaining(currentTripRemaining)
                    .spentPercentage(currentTripPercentage)
                    .build();
        } else {
            budgetSummary = DashboardResponse.DashboardBudgetSummary.builder()
                    .mode("ALL_TRIPS")
                    .tripId(null)
                    .destination(null)
                    .totalBudget(totalBudget)
                    .spent(totalExpenses)
                    .remaining(remainingBudget)
                    .spentPercentage(budgetPercentage)
                    .build();
        }

        List<TripResponse> upcomingTrips = allTrips.stream()
                .filter(t -> t.getStartDate() != null && !t.getStartDate().isBefore(today))
                .filter(t -> t.getStatus() != TripStatus.COMPLETED && t.getStatus() != TripStatus.CANCELLED)
                .sorted(Comparator.comparing(Trip::getStartDate))
                .map(this::mapToTripResponse)
                .toList();

        long upcomingTripsCount = upcomingTrips.size();

        List<ActivityLogResponse> recentActivities = activityLogService.getDashboardActivities(user);

        List<NotificationResponse> notifications = notificationRepository.findTop5ByReceiverOrderByCreatedAtDesc(user)
                .stream()
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .toList();

        return DashboardResponse.builder()
                .totalTrips(totalTrips)
                .upcomingTripsCount(upcomingTripsCount)
                .totalBudget(totalBudget)
                .totalExpenses(totalExpenses)
                .remainingBudget(remainingBudget)
                .budgetPercentage(budgetPercentage)
                .budgetSummary(budgetSummary)
                .upcomingTrips(upcomingTrips)
                .recentActivities(recentActivities)
                .notifications(notifications)
                .build();
    }
}
