package com.tripnest.tripnest.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "destinations")
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Destination name is required")
    @Column(nullable = false)
    private String name;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Column(columnDefinition = "TEXT")
    private String description;

    private String state;

    @NotBlank(message = "Country is required")
    @Column(nullable = false)
    private String country;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DestinationCategory category;

    private String bestTimeToVisit;

    private String weatherInfo;

    private String imageUrl;

    public Destination() {
    }

    public Destination(Long id, String name, String description, String state,
                       String country, DestinationCategory category,
                       String bestTimeToVisit, String weatherInfo,
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