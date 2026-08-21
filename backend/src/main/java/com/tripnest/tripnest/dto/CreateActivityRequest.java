package com.tripnest.tripnest.dto;

import java.time.LocalTime;

import com.tripnest.tripnest.model.ActivityType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateActivityRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @Size(max = 200, message = "Location must not exceed 200 characters")
    private String location;

    private LocalTime startTime;

    private LocalTime endTime;

    @NotNull(message = "Activity type is required")
    private ActivityType activityType;

    @NotNull(message = "Estimated cost is required")
    @DecimalMin(value = "0.0", message = "Estimated cost cannot be negative")
    private Double estimatedCost;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
