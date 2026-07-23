package com.tripnest.tripnest.client;

import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class RestCountriesClient {

    private final RestTemplate restTemplate;

    public RestCountriesClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public CountryResponse getCountryInfo(String countryName) {
        if (countryName == null || countryName.trim().isEmpty()) return null;
        try {
            String url = "https://restcountries.com/v3.1/name/" + countryName + "?fullText=true";
            List<Map<String, Object>> response = restTemplate.getForObject(url, List.class);
            
            if (response != null && !response.isEmpty()) {
                Map<String, Object> data = response.get(0);
                
                String currency = null;
                if (data.containsKey("currencies")) {
                    Map<String, Object> currencies = (Map<String, Object>) data.get("currencies");
                    if (!currencies.isEmpty()) {
                        currency = currencies.keySet().iterator().next();
                    }
                }
                
                String language = null;
                if (data.containsKey("languages")) {
                    Map<String, String> languages = (Map<String, String>) data.get("languages");
                    if (!languages.isEmpty()) {
                        language = languages.values().iterator().next();
                    }
                }
                
                String flagUrl = null;
                if (data.containsKey("flags")) {
                    Map<String, String> flags = (Map<String, String>) data.get("flags");
                    flagUrl = flags.get("svg");
                }
                
                return new CountryResponse(currency, language, flagUrl);
            }
        } catch (Exception e) {
            System.err.println("Error fetching country info for " + countryName + ": " + e.getMessage());
        }
        return null;
    }

    public static class CountryResponse {
        public String currency;
        public String language;
        public String flagUrl;

        public CountryResponse(String currency, String language, String flagUrl) {
            this.currency = currency;
            this.language = language;
            this.flagUrl = flagUrl;
        }
    }
}
