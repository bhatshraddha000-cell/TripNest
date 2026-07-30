package com.tripnest.tripnest.dto;

import java.time.LocalDateTime;

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
public class ActivityLogResponse {

    private Long id;
    private String entityType;
    private Long entityId;
    private String action;
    private String title;
    private String description;
    private LocalDateTime createdAt;
}
