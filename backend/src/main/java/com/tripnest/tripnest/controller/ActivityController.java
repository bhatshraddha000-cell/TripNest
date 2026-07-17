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

import com.tripnest.tripnest.dto.CreateActivityRequest;
import com.tripnest.tripnest.dto.ActivityResponse;
import com.tripnest.tripnest.dto.UpdateActivityRequest;
import com.tripnest.tripnest.service.ActivityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trips/{tripId}/itineraries/{itineraryId}/activities")
@Validated
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ActivityResponse> createActivity(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId,
            @Valid @RequestBody CreateActivityRequest request
    ) {
        ActivityResponse response = activityService.createActivity(tripId, itineraryId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ActivityResponse>> getAllActivities(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId
    ) {
        return ResponseEntity.ok(activityService.getAllActivities(tripId, itineraryId));
    }

    @GetMapping("/{activityId}")
    public ResponseEntity<ActivityResponse> getActivityById(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId,
            @PathVariable Long activityId
    ) {
        return ResponseEntity.ok(activityService.getActivityById(tripId, itineraryId, activityId));
    }

    @PutMapping("/{activityId}")
    public ResponseEntity<ActivityResponse> updateActivity(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId,
            @PathVariable Long activityId,
            @Valid @RequestBody UpdateActivityRequest request
    ) {
        return ResponseEntity.ok(activityService.updateActivity(tripId, itineraryId, activityId, request));
    }

    @DeleteMapping("/{activityId}")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable Long tripId,
            @PathVariable Long itineraryId,
            @PathVariable Long activityId
    ) {
        activityService.deleteActivity(tripId, itineraryId, activityId);
        return ResponseEntity.noContent().build();
    }
}
