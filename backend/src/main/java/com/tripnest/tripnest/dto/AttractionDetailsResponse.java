package com.tripnest.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttractionDetailsResponse {
    private String xid;
    private String name;
    private String category;
    private String rating;
    private String location;
    private String description;
    private String openingHours;
    private String entryFee;
    private String website;
    private String wikipediaLink;
    private Double latitude;
    private Double longitude;
    private String heroImage;
    private List<String> gallery;
    private List<String> nearbyAttractions;
    private List<String> travelTips;
}
