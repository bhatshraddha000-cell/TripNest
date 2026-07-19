package com.tripnest.tripnest.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.tripnest.tripnest.model.ActivityType;

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
public class ActivityResponse {

    private Long id;
    private Long itineraryId;
    private String title;
    private String description;
    private String location;
    private LocalTime startTime;
    private LocalTime endTime;
    private ActivityType activityType;
    private Double estimatedCost;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
