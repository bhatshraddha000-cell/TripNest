package com.tripnest.tripnest.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class AdminTripListResponse {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminTripListItem {
        private Long id;
        private String title;
        private String creatorName;
        private String creatorEmail;
        private String destination;
        private long membersCount;
        private String status;
        private LocalDate startDate;
        private LocalDate endDate;
        private Double budget;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminTripDetails {
        private Long id;
        private String title;
        private String creatorName;
        private String creatorEmail;
        private String groupAdminName;
        private String destination;
        private LocalDate startDate;
        private LocalDate endDate;
        private Double budget;
        private double currentExpenses;
        private long membersCount;
        private long activitiesCount;
        private long documentsCount;
        private List<AdminTripMemberItem> members;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminTripMemberItem {
        private String name;
        private String email;
        private String tripRole; // "GROUP_ADMIN" or "MEMBER"
        private LocalDateTime joinedAt;
    }
}
