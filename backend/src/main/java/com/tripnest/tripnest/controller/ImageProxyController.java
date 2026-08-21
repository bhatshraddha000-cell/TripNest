package com.tripnest.tripnest.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/images")
public class ImageProxyController {

    private final RestTemplate restTemplate;

    public ImageProxyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/proxy")
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        try {
            org.springframework.http.HttpHeaders requestHeaders = new org.springframework.http.HttpHeaders();
            requestHeaders.set("User-Agent", "TripNestApp/1.0 (Contact: tripnest207@gmail.com)");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(requestHeaders);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, byte[].class);
            
            HttpHeaders headers = new HttpHeaders();
            if (response.getHeaders().getContentType() != null) {
                headers.setContentType(response.getHeaders().getContentType());
            }
            headers.setCacheControl("public, max-age=86400");
            
            return new ResponseEntity<>(response.getBody(), headers, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error proxying image " + url + ": " + e.getMessage());
            return new ResponseEntity<>(("Error: " + e.getMessage()).getBytes(), HttpStatus.BAD_GATEWAY);
        }
    }
}
