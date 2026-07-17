package com.tripnest.tripnest.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tripnest.tripnest.model.TripStatus;

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
public class TripResponse {

    private Long id;
    private String title;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer travelers;
    private Double budget;
    private TripStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long ownerId;
}
