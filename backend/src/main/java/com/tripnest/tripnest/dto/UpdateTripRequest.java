package com.tripnest.tripnest.dto;

import java.time.LocalDate;

import com.tripnest.tripnest.model.TripStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class UpdateTripRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Destination is required")
    private String destination;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Travelers count is required")
    @Min(value = 1, message = "Travelers must be at least 1")
    private Integer travelers;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "0.0", message = "Budget cannot be negative")
    private Double budget;

    @NotNull(message = "Status is required")
    private TripStatus status;

    private String description;
}
