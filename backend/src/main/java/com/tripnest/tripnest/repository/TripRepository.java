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
}
