package com.tripnest.tripnest.client;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class NominatimClient {

    private final RestTemplate restTemplate;

    public NominatimClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public NominatimResponse getCoordinates(String destinationName) {
        try {
            String url = "https://nominatim.openstreetmap.org/search?q=" + destinationName + "&format=json&limit=1&addressdetails=1";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "TripNest-App/1.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> body = response.getBody();
            
            if (body != null && !body.isEmpty()) {
                Map<String, Object> location = body.get(0);
                Double lat = Double.parseDouble(location.get("lat").toString());
                Double lon = Double.parseDouble(location.get("lon").toString());
                
                String country = null;
                String addressType = location.containsKey("addresstype") ? location.get("addresstype").toString() : 
                                    (location.containsKey("type") ? location.get("type").toString() : null);
                
                if (location.containsKey("address")) {
                    Map<String, String> address = (Map<String, String>) location.get("address");
                    country = address.get("country");
                }
                
                List<String> bbox = location.containsKey("boundingbox") ? (List<String>) location.get("boundingbox") : null;
                
                return new NominatimResponse(lat, lon, country, addressType, bbox);
            }
        } catch (Exception e) {
            // Log error
            System.err.println("Error fetching coordinates from Nominatim: " + e.getMessage());
        }
        return null;
    }

    public static class NominatimResponse {
        public Double lat;
        public Double lon;
        public String country;
        public String addressType;
        public List<String> boundingBox;
        
        public NominatimResponse(Double lat, Double lon, String country, String addressType, List<String> boundingBox) {
            this.lat = lat;
            this.lon = lon;
            this.country = country;
            this.addressType = addressType;
            this.boundingBox = boundingBox;
        }
    }
}
