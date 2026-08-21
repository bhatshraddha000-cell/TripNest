package com.tripnest.tripnest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.User;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByUser(User user);

    List<Trip> findByUserAndStartDateGreaterThanEqual(User user, java.time.LocalDate date);

    Optional<Trip> findByIdAndUser(Long id, User user);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(tm) > 0 FROM TripMember tm WHERE tm.user = :user AND tm.trip.status != com.tripnest.tripnest.model.TripStatus.CANCELLED AND :startDate <= tm.trip.endDate AND :endDate >= tm.trip.startDate")
    boolean existsOverlappingTripForUser(@org.springframework.data.repository.query.Param("user") User user, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(tm) > 0 FROM TripMember tm WHERE tm.user = :user AND tm.trip.id != :tripId AND tm.trip.status != com.tripnest.tripnest.model.TripStatus.CANCELLED AND :startDate <= tm.trip.endDate AND :endDate >= tm.trip.startDate")
    boolean existsOverlappingTripForUserExcludingTrip(@org.springframework.data.repository.query.Param("user") User user, @org.springframework.data.repository.query.Param("tripId") Long tripId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate);
}
