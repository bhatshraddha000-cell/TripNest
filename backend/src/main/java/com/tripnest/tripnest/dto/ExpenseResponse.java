package com.tripnest.tripnest.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.tripnest.tripnest.model.SplitType;

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
public class ExpenseResponse {
    private Long id;
    private Long tripId;
    private Long activityId;
    private String activityTitle;
    private UserProfileResponse paidBy;
    private String title;
    private String category;
    private Double amount;
    private LocalDate date;
    private String notes;
    private SplitType splitType;
    private List<ExpenseSplitResponse> participants;
    private LocalDateTime createdAt;
}
