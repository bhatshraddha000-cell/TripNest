package com.tripnest.tripnest.controller;

import com.tripnest.tripnest.client.OpenTripMapClient;
import com.tripnest.tripnest.dto.AttractionDetailsResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.cache.annotation.Cacheable;

@RestController
@RequestMapping("/api/attractions")
public class AttractionController {

    private final OpenTripMapClient openTripMapClient;

    public AttractionController(OpenTripMapClient openTripMapClient) {
        this.openTripMapClient = openTripMapClient;
    }

    @GetMapping("/{xid}")
    @Cacheable(value = "attractions", key = "#xid")
    public ResponseEntity<AttractionDetailsResponse> getAttractionDetails(@PathVariable String xid) {
        System.out.println("AttractionController: Received request for xid: " + xid);
        System.out.println("AttractionController: Calling openTripMapClient.getAttractionDetails...");
        AttractionDetailsResponse details = openTripMapClient.getAttractionDetails(xid);
        
        System.out.println("AttractionController: Returned object from client: " + details);
        if (details != null) {
            System.out.println("AttractionController: Returning HTTP 200 OK");
            return ResponseEntity.ok(details);
        } else {
            System.out.println("AttractionController: Returning HTTP 404 NOT FOUND");
            return ResponseEntity.notFound().build();
        }
    }
}
