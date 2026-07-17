package com.tripnest.tripnest.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
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
public class UpdateItineraryRequest {

    @NotNull(message = "Day number is required")
    @Min(value = 1, message = "Day number must be at least 1")
    private Integer dayNumber;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
