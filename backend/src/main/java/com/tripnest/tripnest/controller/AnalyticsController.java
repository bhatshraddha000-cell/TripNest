package com.tripnest.tripnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestParam;

import com.tripnest.tripnest.dto.AnalyticsResponse;
import com.tripnest.tripnest.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsResponse> getTravelerAnalytics(@RequestParam(required = false) Long tripId) {
        return ResponseEntity.ok(analyticsService.getTravelerAnalytics(tripId));
    }
}
