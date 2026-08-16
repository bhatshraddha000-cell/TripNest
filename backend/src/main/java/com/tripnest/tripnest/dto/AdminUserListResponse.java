package com.tripnest.tripnest.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class AdminUserListResponse {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminUserListItem {
        private Long id;
        private String fullName;
        private String email;
        private String role;
        private long tripsCreatedCount;
        private long tripsJoinedCount;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminUserDetails {
        private Long id;
        private String fullName;
        private String email;
        private String role;
        private LocalDateTime createdAt;
        private String status;
        private long tripsCreatedCount;
        private long tripsJoinedCount;
        private long activitiesCount;
        private long expensesCount;
        private List<AdminUserTripItem> trips;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminUserTripItem {
        private Long id;
        private String title;
        private String destination;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;
        private String role; // "Creator" or "Member"
    }
}
