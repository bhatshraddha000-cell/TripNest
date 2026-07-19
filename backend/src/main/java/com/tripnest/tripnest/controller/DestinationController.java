package com.tripnest.tripnest.controller;

import com.tripnest.tripnest.dto.DestinationRequest;
import com.tripnest.tripnest.dto.DestinationResponse;
import com.tripnest.tripnest.model.DestinationCategory;
import com.tripnest.tripnest.service.DestinationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    private final DestinationService destinationService;

    public DestinationController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }

    /**
     * GET /api/destinations
     */
    @GetMapping
    public ResponseEntity<List<DestinationResponse>> getAllDestinations() {
        return ResponseEntity.ok(destinationService.getAllDestinations());
    }

    /**
     * GET /api/destinations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<DestinationResponse> getDestinationById(@PathVariable Long id) {
        return ResponseEntity.ok(destinationService.getDestinationById(id));
    }

    /**
     * GET /api/destinations/search?query=Goa
     */
    @GetMapping("/search")
    public ResponseEntity<List<DestinationResponse>> searchDestinations(
            @RequestParam String query) {

        return ResponseEntity.ok(destinationService.searchDestinations(query));
    }

    /**
     * GET /api/destinations/category/BEACH
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<DestinationResponse>> getByCategory(
            @PathVariable DestinationCategory category) {

        return ResponseEntity.ok(destinationService.filterByCategory(category));
    }

    /**
     * POST /api/destinations
     */
    @PostMapping
    public ResponseEntity<DestinationResponse> createDestination(
            @Valid @RequestBody DestinationRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(destinationService.createDestination(request));
    }

    /**
     * PUT /api/destinations/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<DestinationResponse> updateDestination(
            @PathVariable Long id,
            @Valid @RequestBody DestinationRequest request) {

        return ResponseEntity.ok(destinationService.updateDestination(id, request));
    }

    /**
     * DELETE /api/destinations/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDestination(@PathVariable Long id) {

        destinationService.deleteDestination(id);

        return ResponseEntity.noContent().build();
    }
}