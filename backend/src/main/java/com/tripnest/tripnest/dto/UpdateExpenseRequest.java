package com.tripnest.tripnest.dto;

import java.time.LocalDate;
import java.util.List;

import com.tripnest.tripnest.model.SplitType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class UpdateExpenseRequest {

    private Long activityId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Amount is required")
    @Positive(message = "Expense amount must be greater than zero")
    private Double amount;

    @NotNull(message = "Date is required")
    private LocalDate date;

    private String notes;

    private Long paidById;

    @Builder.Default
    private SplitType splitType = SplitType.EQUAL;

    private List<Long> participantIds;

    private List<ParticipantSplitRequest> customSplits;
}
