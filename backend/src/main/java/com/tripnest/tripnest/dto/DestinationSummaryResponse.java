package com.tripnest.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationSummaryResponse {
    private Long tripId;
    private String destination;
    private String country;
    private String imageUrl;
}
