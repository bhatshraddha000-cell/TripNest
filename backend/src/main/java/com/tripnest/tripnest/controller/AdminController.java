package com.tripnest.tripnest.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tripnest.tripnest.dto.AdminAnalyticsResponse;
import com.tripnest.tripnest.dto.AdminUserListResponse;
import com.tripnest.tripnest.dto.AdminTripListResponse;
import com.tripnest.tripnest.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AnalyticsService analyticsService;

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsResponse> getAdminAnalytics() {
        return ResponseEntity.ok(analyticsService.getAdminAnalytics());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserListResponse.AdminUserListItem>> getAdminUsers() {
        return ResponseEntity.ok(analyticsService.getAdminUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserListResponse.AdminUserDetails> getAdminUserDetails(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.getAdminUserDetails(id));
    }

    @GetMapping("/trips")
    public ResponseEntity<List<AdminTripListResponse.AdminTripListItem>> getAdminTrips() {
        return ResponseEntity.ok(analyticsService.getAdminTrips());
    }

    @GetMapping("/trips/{id}")
    public ResponseEntity<AdminTripListResponse.AdminTripDetails> getAdminTripDetails(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.getAdminTripDetails(id));
    }
}
