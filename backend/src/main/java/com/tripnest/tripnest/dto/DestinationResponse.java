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
public class DestinationResponse {
    private String name;
    private String country;
    
    // Wikipedia
    private String description;
    
    // OpenStreetMap Nominatim
    private Double latitude;
    private Double longitude;
    
    // REST Countries
    private String currency;
    private String language;
    private String flagUrl;
    
    // Open-Meteo
    private Double currentTemperature;
    private Integer weatherCode;
    private String timezone;
    private String timezoneAbbreviation;
    
    // OpenTripMap / Generic
    private List<String> pointsOfInterest;
    private List<AttractionSummary> topAttractions;
    private List<String> nearbyPlaces;
    
    // Generic
    private String bestTime;
    private List<String> travelTips;
    private List<String> localFoods;
    
    // ImageClient
    private String heroImage;  
    private List<String> gallery; 
}