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
public class AnalyticsResponse {
    private long totalTrips;
    private long upcomingTrips;
    private long ongoingTrips;
    private long completedTrips;

    private double totalBudget;
    private double totalEstimatedCost;
    private double totalSpent;
    private double remainingBudget;
    private double budgetUtilization;

    private long totalActivities;
    private long totalDestinations;

    private Map<String, Double> expenseByCategory;
    private Map<String, Long> tripsByStatus;
    private Map<String, Double> spendingByTrip;
    private List<FavoriteDestinationDto> favoriteDestinations;

    // Expense summary fields
    private long totalExpensesCount;
    private double totalAmountSpent;
    private double amountPaidByCurrentUser;
    private double amountOwedByCurrentUser;
    private double amountToReceive;
    private double settledAmount;
    private double pendingAmount;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FavoriteDestinationDto {
        private String destination;
        private long tripCount;
    }
}
