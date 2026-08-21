package com.tripnest.tripnest.client;

import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class OpenMeteoClient {

    private final RestTemplate restTemplate;

    public OpenMeteoClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public WeatherResponse getCurrentWeather(Double lat, Double lon) {
        if (lat == null || lon == null) return null;
        try {
            String url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true&timezone=auto";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("current_weather")) {
                Map<String, Object> currentWeather = (Map<String, Object>) response.get("current_weather");
                Double temp = Double.parseDouble(currentWeather.get("temperature").toString());
                Integer code = Integer.parseInt(currentWeather.get("weathercode").toString());
                String tz = response.containsKey("timezone") ? response.get("timezone").toString() : null;
                String tzAbbr = response.containsKey("timezone_abbreviation") ? response.get("timezone_abbreviation").toString() : null;
                return new WeatherResponse(temp, code, tz, tzAbbr);
            }
        } catch (Exception e) {
            System.err.println("Error fetching weather: " + e.getMessage());
        }
        return null;
    }

    public static class WeatherResponse {
        public Double temperature;
        public Integer weatherCode;
        public String timezone;
        public String timezoneAbbreviation;
        public WeatherResponse(Double temperature, Integer weatherCode, String timezone, String timezoneAbbreviation) {
            this.temperature = temperature;
            this.weatherCode = weatherCode;
            this.timezone = timezone;
            this.timezoneAbbreviation = timezoneAbbreviation;
        }
    }
}
