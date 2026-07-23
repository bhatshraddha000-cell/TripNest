package com.tripnest.tripnest.client;

import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

@Component
public class WikipediaClient {

    private final RestTemplate restTemplate;

    public WikipediaClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public String getDescription(String destinationName) {
        WikiData data = getWikiData(destinationName);
        return data != null ? data.extract : null;
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public WikiData getWikiData(String title) {
        try {
            String url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + title.replace(" ", "_");
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "TripNestApp/1.0 (Contact: tripnest207@gmail.com)");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            
            if (response != null) {
                String extract = null;
                String image = null;

                if (response.containsKey("extract")) {
                    extract = response.get("extract").toString();
                }

                if (response.containsKey("thumbnail")) {
                    Map<String, Object> thumb = (Map<String, Object>) response.get("thumbnail");
                    if (thumb.containsKey("source")) {
                        image = thumb.get("source").toString();
                    }
                } else if (response.containsKey("originalimage")) {
                    Map<String, Object> orig = (Map<String, Object>) response.get("originalimage");
                    if (orig.containsKey("source")) {
                        image = orig.get("source").toString();
                    }
                }

                return new WikiData(extract, image);
            }
        } catch (Exception e) {
            System.err.println("Error fetching wikipedia info for " + title + ": " + e.getMessage());
        }
        return null;
    }

    public static class WikiData {
        public String extract;
        public String image;
        
        public WikiData(String extract, String image) {
            this.extract = extract;
            this.image = image;
        }
    }
}
