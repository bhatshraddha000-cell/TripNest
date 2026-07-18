package com.tripnest.tripnest.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class ItineraryResponse {

    private Long id;
    private Integer dayNumber;
    private LocalDate date;
    private String title;
    private String notes;
    private Long tripId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ActivityResponse> activities;
}
