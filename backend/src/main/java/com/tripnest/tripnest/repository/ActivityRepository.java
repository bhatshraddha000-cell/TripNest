package com.tripnest.tripnest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.Trip;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByItineraryIdOrderByStartTimeAsc(Long itineraryId);

    Optional<Activity> findByIdAndItineraryId(Long id, Long itineraryId);

    List<Activity> findByItineraryTripIn(List<Trip> trips);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) > 0 FROM Activity a WHERE a.itinerary.id = :itineraryId AND a.startTime IS NOT NULL AND a.endTime IS NOT NULL AND :startTime < a.endTime AND :endTime > a.startTime")
    boolean existsOverlappingActivityForItinerary(@org.springframework.data.repository.query.Param("itineraryId") Long itineraryId, @org.springframework.data.repository.query.Param("startTime") java.time.LocalTime startTime, @org.springframework.data.repository.query.Param("endTime") java.time.LocalTime endTime);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(a) > 0 FROM Activity a WHERE a.itinerary.id = :itineraryId AND a.id != :activityId AND a.startTime IS NOT NULL AND a.endTime IS NOT NULL AND :startTime < a.endTime AND :endTime > a.startTime")
    boolean existsOverlappingActivityForItineraryExcludingActivity(@org.springframework.data.repository.query.Param("itineraryId") Long itineraryId, @org.springframework.data.repository.query.Param("activityId") Long activityId, @org.springframework.data.repository.query.Param("startTime") java.time.LocalTime startTime, @org.springframework.data.repository.query.Param("endTime") java.time.LocalTime endTime);
}
