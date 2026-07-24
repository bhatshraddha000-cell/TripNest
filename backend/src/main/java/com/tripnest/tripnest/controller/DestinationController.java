package com.tripnest.tripnest.controller;

import com.tripnest.tripnest.dto.DestinationResponse;
import com.tripnest.tripnest.dto.DestinationSummaryResponse;
import com.tripnest.tripnest.service.DestinationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    private final DestinationService destinationService;

    public DestinationController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }

    /**
     * GET /api/destinations/my-destinations
     * Retrieves aggregated destination information for the authenticated user's upcoming trips.
     */
    @GetMapping("/my-destinations")
    public ResponseEntity<List<DestinationSummaryResponse>> getMyDestinations() {
        return ResponseEntity.ok(destinationService.getMyUpcomingDestinations());
    }

    @GetMapping("/my-destinations/{tripId}")
    public ResponseEntity<DestinationResponse> getDestinationDetails(@PathVariable Long tripId) {
        return ResponseEntity.ok(destinationService.getDestinationDataByTripId(tripId));
    }
}