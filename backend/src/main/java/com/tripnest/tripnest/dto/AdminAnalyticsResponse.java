package com.tripnest.tripnest.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAnalyticsResponse {
    // User Analytics
    private long totalUsers;
    private long activeUsers;
    private long newUsers;
    private long usersInTrips;
    private long groupMembersCount;

    // Trip Analytics
    private long totalTrips;
    private long upcomingTrips;
    private long ongoingTrips;
    private long completedTrips;
    private long groupTrips;
    private double averageMembersPerTrip;

    // Destination Analytics
    private long totalDestinations;
    private List<PopularDestinationDto> popularDestinations;

    // Platform Statistics
    private long totalActivities;
    private long totalExpenses;
    private long totalDocuments;
    private long totalNotifications;

    // Revenue reports
    private String revenueReportStatus;
    private double platformRevenue;

    // Added metrics for detailed dashboard
    private long newUsersLast7Days;
    private long usersWhoCreatedTrips;
    private long uniqueUsersInTrips;
    private long totalTripMemberships;

    private Map<String, Long> userRegistrationTrend;
    private Map<String, Double> expensesByMonth;
    private Map<String, Long> activitiesByMonth;
    private Map<String, Long> activitiesByType;
    private Map<String, Long> documentsByType;
    private Map<String, Long> notificationsByType;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularDestinationDto {
        private String destination;
        private long tripCount;
    }
}
