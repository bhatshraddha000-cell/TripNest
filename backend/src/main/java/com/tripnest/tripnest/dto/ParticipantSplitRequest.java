package com.tripnest.tripnest.dto;

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
public class ParticipantSplitRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @Positive(message = "Share amount must be positive")
    private Double amount;
}
