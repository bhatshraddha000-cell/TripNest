package com.tripnest.tripnest.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Itinerary;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {

    List<Itinerary> findByTripIdOrderByDateAscDayNumberAsc(Long tripId);

    Optional<Itinerary> findByIdAndTripId(Long id, Long tripId);

    boolean existsByTripIdAndDayNumber(Long tripId, Integer dayNumber);

    boolean existsByTripIdAndDate(Long tripId, LocalDate date);
}
