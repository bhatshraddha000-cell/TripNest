package com.tripnest.tripnest.service;

import com.tripnest.tripnest.client.*;
import com.tripnest.tripnest.dto.DestinationResponse;
import com.tripnest.tripnest.dto.DestinationSummaryResponse;
import com.tripnest.tripnest.dto.AttractionSummary;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;

@Service
public class DestinationService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final NominatimClient nominatimClient;
    private final OpenMeteoClient openMeteoClient;
    private final RestCountriesClient restCountriesClient;
    private final WikipediaClient wikipediaClient;
    private final OpenTripMapClient openTripMapClient;
    private final ImageClient imageClient;

    public DestinationService(TripRepository tripRepository,
                              UserRepository userRepository,
                              NominatimClient nominatimClient,
                              OpenMeteoClient openMeteoClient,
                              RestCountriesClient restCountriesClient,
                              WikipediaClient wikipediaClient,
                              OpenTripMapClient openTripMapClient,
                              ImageClient imageClient) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.nominatimClient = nominatimClient;
        this.openMeteoClient = openMeteoClient;
        this.restCountriesClient = restCountriesClient;
        this.wikipediaClient = wikipediaClient;
        this.openTripMapClient = openTripMapClient;
        this.imageClient = imageClient;
    }

    public List<DestinationSummaryResponse> getMyUpcomingDestinations() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(username.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<Trip> upcomingTrips = tripRepository.findByUserAndStartDateGreaterThanEqual(user, LocalDate.now());

        return upcomingTrips.stream()
                .map(trip -> {
                    String destination = trip.getDestination();
                    String country = "Unknown";
                    NominatimClient.NominatimResponse coords = nominatimClient.getCoordinates(destination);
                    if (coords != null && coords.country != null) {
                        country = coords.country;
                    }
                    String imageUrl = imageClient.getHeroImage(destination);
                    
                    return DestinationSummaryResponse.builder()
                            .tripId(trip.getId())
                            .destination(destination)
                            .country(country)
                            .imageUrl(imageUrl)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public DestinationResponse getDestinationDataByTripId(Long tripId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(username.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
                
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
                
        if (!trip.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to this trip");
        }
        
        return getDestinationData(trip.getDestination());
    }

    @Cacheable(value = "destinations", key = "#destinationName.toLowerCase()")
    public DestinationResponse getDestinationData(String destinationName) {
        DestinationResponse.DestinationResponseBuilder builder = DestinationResponse.builder();
        builder.name(destinationName);

        // 1. Kick off parallel independent calls
        CompletableFuture<String> descriptionFuture = CompletableFuture.supplyAsync(() -> 
                wikipediaClient.getDescription(destinationName)
        ).exceptionally(ex -> null);

        CompletableFuture<String> heroImageFuture = CompletableFuture.supplyAsync(() -> 
                imageClient.getHeroImage(destinationName)
        ).exceptionally(ex -> null);

        CompletableFuture<List<String>> galleryFuture = CompletableFuture.supplyAsync(() -> 
                imageClient.getGalleryImages(destinationName)
        ).exceptionally(ex -> null);

        // 2. Nominatim is blocking for geo-dependent calls
        NominatimClient.NominatimResponse coords = null;
        try {
            coords = nominatimClient.getCoordinates(destinationName);
        } catch (Exception ignored) {}

        if (coords != null) {
            builder.latitude(coords.lat);
            builder.longitude(coords.lon);

            final NominatimClient.NominatimResponse finalCoords = coords;

            CompletableFuture<Void> countryInfoFuture = CompletableFuture.runAsync(() -> {
                if (finalCoords.country != null) {
                    builder.country(finalCoords.country);
                    RestCountriesClient.CountryResponse countryInfo = restCountriesClient.getCountryInfo(finalCoords.country);
                    if (countryInfo != null) {
                        builder.currency(countryInfo.currency);
                        builder.language(countryInfo.language);
                        builder.flagUrl(countryInfo.flagUrl);
                    }
                }
            }).exceptionally(ex -> null);

            CompletableFuture<Void> weatherFuture = CompletableFuture.runAsync(() -> {
                OpenMeteoClient.WeatherResponse weather = openMeteoClient.getCurrentWeather(finalCoords.lat, finalCoords.lon);
                if (weather != null) {
                    builder.currentTemperature(weather.temperature);
                    builder.weatherCode(weather.weatherCode);
                    builder.timezone(weather.timezone);
                    builder.timezoneAbbreviation(weather.timezoneAbbreviation);
                }
            }).exceptionally(ex -> null);

            CompletableFuture<Void> poisFuture = CompletableFuture.runAsync(() -> {
                List<AttractionSummary> summaries = openTripMapClient.getTopAttractions(finalCoords);
                builder.topAttractions(summaries);
                
                // Keep pointsOfInterest for backward compatibility
                List<String> pois = summaries.stream().map(AttractionSummary::getName).collect(Collectors.toList());
                builder.pointsOfInterest(pois);
                
                // Dynamically synthesize other fallback content to ensure sections render gracefully
                builder.bestTime("Spring and Autumn are generally the best times to visit " + destinationName + ".");
                
                String displayCountry = finalCoords.country != null ? finalCoords.country : destinationName;
                builder.travelTips(List.of(
                    "Check local weather in " + destinationName + " before packing.",
                    "Ensure your passport is valid for travel to " + displayCountry + ".",
                    "Learn a few basic phrases to easily communicate with locals."
                ));
                
                builder.localFoods(List.of(
                    "Traditional " + displayCountry + " street food",
                    "Famous local desserts",
                    "Authentic " + destinationName + " cuisine"
                ));
                
                if (pois != null && pois.size() > 2) {
                    builder.nearbyPlaces(List.of(pois.get(0) + " District", "Historic Center of " + destinationName));
                } else {
                    builder.nearbyPlaces(List.of("Downtown " + destinationName, destinationName + " Central Square"));
                }
            }).exceptionally(ex -> null);

            // Wait for all geo-dependent tasks
            CompletableFuture.allOf(countryInfoFuture, weatherFuture, poisFuture).join();
        }

        // Wait for independent tasks and set
        CompletableFuture.allOf(descriptionFuture, heroImageFuture, galleryFuture).join();
        builder.description(descriptionFuture.join());
        builder.heroImage(heroImageFuture.join());
        builder.gallery(galleryFuture.join());

        return builder.build();
    }
}