package com.tripnest.tripnest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Activity;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByItineraryIdOrderByStartTimeAsc(Long itineraryId);

    Optional<Activity> findByIdAndItineraryId(Long id, Long itineraryId);
}
