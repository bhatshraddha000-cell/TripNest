package com.tripnest.tripnest.service;

import com.tripnest.tripnest.dto.DestinationRequest;
import com.tripnest.tripnest.dto.DestinationResponse;
import com.tripnest.tripnest.model.Destination;
import com.tripnest.tripnest.model.DestinationCategory;
import com.tripnest.tripnest.repository.DestinationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DestinationService {

    private final DestinationRepository destinationRepository;

    public DestinationService(DestinationRepository destinationRepository) {
        this.destinationRepository = destinationRepository;
    }

    // Get all destinations
    public List<DestinationResponse> getAllDestinations() {
        return destinationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Get destination by ID
    public DestinationResponse getDestinationById(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Destination not found with id: " + id));

        return mapToResponse(destination);
    }

    // Search by name
    public List<DestinationResponse> searchDestinations(String query) {
        return destinationRepository.findByNameContainingIgnoreCase(query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Filter by category
    public List<DestinationResponse> filterByCategory(DestinationCategory category) {
        return destinationRepository.findByCategory(category)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Create destination
    public DestinationResponse createDestination(DestinationRequest request) {

        Destination destination = new Destination();

        destination.setName(request.getName());
        destination.setDescription(request.getDescription());
        destination.setState(request.getState());
        destination.setCountry(request.getCountry());
        destination.setCategory(request.getCategory());
        destination.setBestTimeToVisit(request.getBestTimeToVisit());
        destination.setWeatherInfo(request.getWeatherInfo());
        destination.setImageUrl(request.getImageUrl());

        Destination saved = destinationRepository.save(destination);

        return mapToResponse(saved);
    }

    // Update destination
    public DestinationResponse updateDestination(Long id, DestinationRequest request) {

        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Destination not found with id: " + id));

        destination.setName(request.getName());
        destination.setDescription(request.getDescription());
        destination.setState(request.getState());
        destination.setCountry(request.getCountry());
        destination.setCategory(request.getCategory());
        destination.setBestTimeToVisit(request.getBestTimeToVisit());
        destination.setWeatherInfo(request.getWeatherInfo());
        destination.setImageUrl(request.getImageUrl());

        Destination updated = destinationRepository.save(destination);

        return mapToResponse(updated);
    }

    // Delete destination
    public void deleteDestination(Long id) {

        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Destination not found with id: " + id));

        destinationRepository.delete(destination);
    }

    // DTO Mapper
    private DestinationResponse mapToResponse(Destination destination) {

        DestinationResponse response = new DestinationResponse();

        response.setId(destination.getId());
        response.setName(destination.getName());
        response.setDescription(destination.getDescription());
        response.setState(destination.getState());
        response.setCountry(destination.getCountry());
        response.setCategory(destination.getCategory());
        response.setBestTimeToVisit(destination.getBestTimeToVisit());
        response.setWeatherInfo(destination.getWeatherInfo());
        response.setImageUrl(destination.getImageUrl());

        return response;
    }
}