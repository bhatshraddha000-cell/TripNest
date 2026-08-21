package com.tripnest.tripnest.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tripnest.tripnest.dto.CreateItineraryRequest;
import com.tripnest.tripnest.dto.ItineraryResponse;
import com.tripnest.tripnest.dto.UpdateItineraryRequest;
import com.tripnest.tripnest.service.ItineraryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trips/{tripId}/itineraries")
@Validated
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @PostMapping
    public ResponseEntity<ItineraryResponse> createItinerary(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateItineraryRequest request
    ) {
        ItineraryResponse response = itineraryService.createItinerary(tripId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ItineraryResponse>> getAllItineraries(@PathVariable Long tripId) {
        return ResponseEntity.ok(itineraryService.getAllItineraries(tripId));
    }

    @GetMapping("/{itineraryId}")
    public ResponseEntity<ItineraryResponse> getItineraryById(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId
    ) {
        return ResponseEntity.ok(itineraryService.getItineraryById(tripId, itineraryId));
    }

    @PutMapping("/{itineraryId}")
    public ResponseEntity<ItineraryResponse> updateItinerary(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId,
            @Valid @RequestBody UpdateItineraryRequest request
    ) {
        return ResponseEntity.ok(itineraryService.updateItinerary(tripId, itineraryId, request));
    }

    @DeleteMapping("/{itineraryId}")
    public ResponseEntity<Void> deleteItinerary(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId
    ) {
        itineraryService.deleteItinerary(tripId, itineraryId);
        return ResponseEntity.noContent().build();
    }
}
