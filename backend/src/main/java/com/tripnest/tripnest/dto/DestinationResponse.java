package com.tripnest.tripnest.dto;

import com.tripnest.tripnest.model.DestinationCategory;

public class DestinationResponse {

    private Long id;
    private String name;
    private String description;
    private String state;
    private String country;
    private DestinationCategory category;
    private String bestTimeToVisit;
    private String weatherInfo;
    private String imageUrl;

    public DestinationResponse() {
    }

    public DestinationResponse(Long id, String name, String description,
                               String state, String country,
                               DestinationCategory category,
                               String bestTimeToVisit,
                               String weatherInfo,
                               String imageUrl) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.state = state;
        this.country = country;
        this.category = category;
        this.bestTimeToVisit = bestTimeToVisit;
        this.weatherInfo = weatherInfo;
        this.imageUrl = imageUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public DestinationCategory getCategory() {
        return category;
    }

    public void setCategory(DestinationCategory category) {
        this.category = category;
    }

    public String getBestTimeToVisit() {
        return bestTimeToVisit;
    }

    public void setBestTimeToVisit(String bestTimeToVisit) {
        this.bestTimeToVisit = bestTimeToVisit;
    }

    public String getWeatherInfo() {
        return weatherInfo;
    }

    public void setWeatherInfo(String weatherInfo) {
        this.weatherInfo = weatherInfo;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}