package com.tripnest.tripnest.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Backoff;
import org.springframework.web.client.RestTemplate;
import org.springframework.cache.annotation.Cacheable;

import com.tripnest.tripnest.dto.AttractionSummary;
import com.tripnest.tripnest.dto.AttractionDetailsResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Component
public class OpenTripMapClient {

    private final RestTemplate restTemplate;
    private final WikipediaClient wikipediaClient;

    @Value("${opentripmap.api.key:5ae2e3f221c38a28845f05b637d99595f9c491295fcfa2c2a047d7c6}")
    private String apiKey;

    public OpenTripMapClient(RestTemplate restTemplate, WikipediaClient wikipediaClient) {
        this.restTemplate = restTemplate;
        this.wikipediaClient = wikipediaClient;
    }

    // Helper class to store scoring state
    private static class RankedAttraction {
        AttractionSummary summary;
        AttractionDetailsResponse details;
        int preScore;
        int finalScore;

        RankedAttraction(AttractionSummary summary, int preScore) {
            this.summary = summary;
            this.preScore = preScore;
            this.finalScore = preScore;
        }
    }

    public List<AttractionSummary> getTopAttractions(NominatimClient.NominatimResponse coords) {
        List<RankedAttraction> candidates = new ArrayList<>();
        if (coords.lat == null || coords.lon == null || apiKey == null || apiKey.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            boolean isLargeRegion = "state".equalsIgnoreCase(coords.addressType) 
                    || "administrative".equalsIgnoreCase(coords.addressType)
                    || "country".equalsIgnoreCase(coords.addressType);

            String url = "";
            boolean fetchSuccess = false;

            // 1. Try Bbox for large regions
            if (isLargeRegion && coords.boundingBox != null && coords.boundingBox.size() == 4) {
                String sLat = coords.boundingBox.get(0);
                String nLat = coords.boundingBox.get(1);
                String wLon = coords.boundingBox.get(2);
                String eLon = coords.boundingBox.get(3);
                
                url = "https://api.opentripmap.com/0.1/en/places/bbox?lon_min=" + wLon + "&lat_min=" + sLat 
                        + "&lon_max=" + eLon + "&lat_max=" + nLat + "&kinds=interesting_places&limit=150&apikey=" + apiKey;
                
                fetchSuccess = fetchCandidates(url, candidates);
            }

            // 2. Fallback to radius if bbox fails, or if it's a city
            if (!fetchSuccess) {
                int radius = isLargeRegion ? 100000 : 75000;
                url = "https://api.opentripmap.com/0.1/en/places/radius?radius=" + radius + "&lon=" + coords.lon + "&lat=" + coords.lat 
                        + "&kinds=interesting_places&limit=150&apikey=" + apiKey;
                fetchCandidates(url, candidates);
            }

            // 3. Sort by preScore and take Top 40 to fetch details
            candidates.sort((a, b) -> Integer.compare(b.preScore, a.preScore));
            List<RankedAttraction> top40 = candidates.stream().limit(40).collect(Collectors.toList());

            // 4. Fetch details concurrently for the Top 40
            List<CompletableFuture<Void>> futures = top40.stream()
                .map(ranked -> CompletableFuture.runAsync(() -> {
                    AttractionDetailsResponse details = getAttractionDetails(ranked.summary.getXid());
                    ranked.details = details;
                    
                    // Re-score based on full data
                    if (details != null) {
                        if (details.getHeroImage() != null && !details.getHeroImage().isEmpty()) {
                            ranked.finalScore += 25; // Massive boost for having an image
                        }
                        if (details.getDescription() != null && details.getDescription().length() > 20) {
                            ranked.finalScore += 15; // Boost for having a description
                        }
                    }
                }))
                .collect(Collectors.toList());

            // Wait for all detail fetches to complete
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            // 5. Final sort based on new scores, take absolute Top 20
            top40.sort((a, b) -> Integer.compare(b.finalScore, a.finalScore));
            List<RankedAttraction> finalTop20 = top40.stream().limit(20).collect(Collectors.toList());

            // 6. Map and enrich the final 20
            return finalTop20.stream().map(ranked -> {
                AttractionSummary summary = ranked.summary;
                if (ranked.details != null) {
                    enrichSummaryWithDetails(summary, ranked.details);
                } else {
                    enrichWithWiki(summary);
                }
                return summary;
            }).collect(Collectors.toList());

        } catch (Exception e) {
            System.err.println("Error fetching Top Attractions from OpenTripMap: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private boolean fetchCandidates(String url, List<RankedAttraction> candidates) {
        try {
            System.out.println("Calling OpenTripMap Search API: " + url.replace(apiKey, "***"));
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("features")) {
                List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
                if (features.isEmpty()) return false;

                for (Map<String, Object> feature : features) {
                    if (feature.containsKey("properties")) {
                        Map<String, Object> properties = (Map<String, Object>) feature.get("properties");
                        String name = properties.containsKey("name") ? properties.get("name").toString().trim() : "";
                        String xid = properties.containsKey("xid") ? properties.get("xid").toString() : "";
                        String kind = properties.containsKey("kinds") ? properties.get("kinds").toString() : "";
                        int rate = properties.containsKey("rate") ? Integer.parseInt(properties.get("rate").toString()) : 0;

                        if (!name.isEmpty() && !xid.isEmpty() && isDesirableAttraction(name, kind)) {
                            AttractionSummary summary = new AttractionSummary();
                            summary.setXid(xid);
                            summary.setName(name);
                            summary.setKind(kind);
                            summary.setRating(String.valueOf(rate));

                            if (feature.containsKey("geometry")) {
                                Map<String, Object> geometry = (Map<String, Object>) feature.get("geometry");
                                if (geometry.containsKey("coordinates")) {
                                    List<Number> coordinates = (List<Number>) geometry.get("coordinates");
                                    if (coordinates.size() >= 2) {
                                        summary.setLongitude(coordinates.get(0).doubleValue());
                                        summary.setLatitude(coordinates.get(1).doubleValue());
                                    }
                                }
                            }
                            
                            // Base Score calculation from initial metadata
                            int preScore = (rate * 10);
                            String lowerKind = kind.toLowerCase();
                            
                            if (lowerKind.contains("wikidata") || lowerKind.contains("wikipedia")) preScore += 10;
                            if (lowerKind.contains("unesco")) preScore += 20;
                            if (lowerKind.contains("museum") || lowerKind.contains("palace") 
                                || lowerKind.contains("national_park") || lowerKind.contains("historic")
                                || lowerKind.contains("monument")) {
                                preScore += 10;
                            }
                            
                            candidates.add(new RankedAttraction(summary, preScore));
                        }
                    }
                }
                return true;
            }
        } catch (Exception e) {
            System.err.println("Search API failed: " + e.getMessage());
        }
        return false;
    }

    private boolean isDesirableAttraction(String name, String kind) {
        String lowerName = name.toLowerCase();
        if (lowerName.matches(".*\\b(bus stop|school|college|hospital|hotel|shop|parking|village|office|road|residence|clinic|police|administrative|government)\\b.*")) {
            return false;
        }
        return true;
    }

    private void enrichSummaryWithDetails(AttractionSummary summary, AttractionDetailsResponse details) {
        String image = details.getHeroImage();
        if (image == null || image.isEmpty()) {
            WikipediaClient.WikiData wiki = wikipediaClient.getWikiData(summary.getName());
            if (wiki != null && wiki.image != null) {
                image = wiki.image;
            } else {
                image = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop";
            }
        }
        summary.setImage(image);

        String description = details.getDescription();
        if (description == null || description.isEmpty() || description.length() < 15) {
            WikipediaClient.WikiData wiki = wikipediaClient.getWikiData(summary.getName());
            if (wiki != null && wiki.extract != null) {
                description = wiki.extract;
            } else {
                description = "A famous local attraction worth visiting.";
            }
        }
        summary.setDescription(description);

        summary.setRating(details.getRating() != null ? details.getRating() : "4.5");
        
        if (details.getCategory() != null) {
            String cat = details.getCategory().split(",")[0].replace("_", " ");
            summary.setKind(cat.substring(0, 1).toUpperCase() + cat.substring(1));
        } else {
            summary.setKind("Tourist Attraction");
        }
    }

    private void enrichWithWiki(AttractionSummary summary) {
        WikipediaClient.WikiData wiki = wikipediaClient.getWikiData(summary.getName());
        if (wiki != null && wiki.image != null) {
            summary.setImage(wiki.image);
        } else {
            summary.setImage("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop");
        }

        if (wiki != null && wiki.extract != null) {
            summary.setDescription(wiki.extract);
        } else {
            summary.setDescription("A famous local attraction worth visiting.");
        }
        summary.setRating("4.5");
        summary.setKind("Tourist Attraction");
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public List<AttractionSummary> getAttractionSummaries(Double lat, Double lon) {
        NominatimClient.NominatimResponse coords = new NominatimClient.NominatimResponse(lat, lon, null, null, null);
        return getTopAttractions(coords);
    }

    @Cacheable(value = "attractionDetails", key = "#xid", unless = "#result == null")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public AttractionDetailsResponse getAttractionDetails(String xid) {
        if (xid == null || xid.trim().isEmpty()) return null;
        if (apiKey == null || apiKey.trim().isEmpty()) return null;

        try {
            String url = "https://api.opentripmap.com/0.1/en/places/xid/" + xid + "?apikey=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || response.isEmpty() || response.containsKey("error")) {
                return null;
            }

            AttractionDetailsResponse details = new AttractionDetailsResponse();
            details.setXid(xid);

            if (response.get("name") != null) details.setName(response.get("name").toString());
            if (response.get("kinds") != null) details.setCategory(response.get("kinds").toString());
            
            if (response.get("rate") != null) {
                int rate = Integer.parseInt(response.get("rate").toString().substring(0, 1));
                double displayRate = Math.min(5.0, 3.5 + (rate * 0.2));
                details.setRating(String.format("%.1f", displayRate));
            } else {
                details.setRating("4.5");
            }

            if (response.get("url") != null) details.setWebsite(response.get("url").toString());
            if (response.get("wikipedia") != null) details.setWikipediaLink(response.get("wikipedia").toString());

            if (response.containsKey("preview")) {
                Map<String, Object> preview = (Map<String, Object>) response.get("preview");
                if (preview.containsKey("source")) {
                    details.setHeroImage(preview.get("source").toString());
                }
            } else if (response.get("image") != null) {
                details.setHeroImage(response.get("image").toString());
            }

            if (response.containsKey("point")) {
                Map<String, Object> point = (Map<String, Object>) response.get("point");
                if (point.get("lat") != null) details.setLatitude(Double.valueOf(point.get("lat").toString()));
                if (point.get("lon") != null) details.setLongitude(Double.valueOf(point.get("lon").toString()));
            }

            if (response.containsKey("address")) {
                Map<String, Object> address = (Map<String, Object>) response.get("address");
                StringBuilder location = new StringBuilder();
                if (address.get("road") != null) location.append(address.get("road")).append(", ");
                if (address.get("city") != null) location.append(address.get("city")).append(", ");
                else if (address.get("town") != null) location.append(address.get("town")).append(", ");
                else if (address.get("village") != null) location.append(address.get("village")).append(", ");
                if (address.get("country") != null) location.append(address.get("country"));
                details.setLocation(location.toString());
            }

            if (response.containsKey("info")) {
                Map<String, Object> info = (Map<String, Object>) response.get("info");
                if (info.get("descr") != null) details.setDescription(info.get("descr").toString());
            } else if (response.containsKey("wikipedia_extracts")) {
                Map<String, Object> wiki = (Map<String, Object>) response.get("wikipedia_extracts");
                if (wiki.get("text") != null) details.setDescription(wiki.get("text").toString());
            }

            return details;
        } catch (Exception e) {
            System.err.println("Error fetching OTM details for xid " + xid + ": " + e.getMessage());
            return null;
        }
    }
}
