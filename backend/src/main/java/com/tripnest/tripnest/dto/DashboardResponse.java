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
    private List<TripResponse> upcomingTrips;
    private List<ActivityLogResponse> recentActivities;
}
