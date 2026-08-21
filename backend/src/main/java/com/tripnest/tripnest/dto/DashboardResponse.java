package com.tripnest.tripnest.dto;

import java.util.List;

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
public class DashboardResponse {

    private long totalTrips;
    private long upcomingTripsCount;
    private double totalBudget;
    private double totalExpenses;
    private double remainingBudget;
    private double budgetPercentage;
    private DashboardBudgetSummary budgetSummary;
    private List<TripResponse> upcomingTrips;
    private List<ActivityLogResponse> recentActivities;
    private List<NotificationResponse> notifications;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardBudgetSummary {
        private String mode;
        private Long tripId;
        private String destination;
        private double totalBudget;
        private double spent;
        private double remaining;
        private double spentPercentage;
    }
}
