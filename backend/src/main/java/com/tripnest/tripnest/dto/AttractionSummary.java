package com.tripnest.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttractionSummary {
    private String xid;
    private String name;
    private Double latitude;
    private Double longitude;
    private String kind;
    private String image;
    private String description;
    private String rating;
}
