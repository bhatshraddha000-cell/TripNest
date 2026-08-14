package com.tripnest.tripnest.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tripnest.tripnest.dto.CreateChatMessageRequest;
import com.tripnest.tripnest.dto.TripChatMessageResponse;
import com.tripnest.tripnest.service.TripChatService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/trips/{tripId}/chat")
@RequiredArgsConstructor
public class TripChatController {

    private final TripChatService tripChatService;

    @GetMapping
    public ResponseEntity<List<TripChatMessageResponse>> getTripMessages(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripChatService.getTripMessages(tripId));
    }

    @PostMapping
    public ResponseEntity<TripChatMessageResponse> sendMessage(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateChatMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripChatService.sendMessage(tripId, request));
    }
}
