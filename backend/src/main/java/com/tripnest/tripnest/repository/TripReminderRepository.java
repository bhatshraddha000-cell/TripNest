package com.tripnest.tripnest.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.TripReminder;

@Repository
public interface TripReminderRepository extends JpaRepository<TripReminder, Long> {

    boolean existsByTripIdAndReminderType(Long tripId, String reminderType);

    Optional<TripReminder> findByTripIdAndReminderType(Long tripId, String reminderType);

    void deleteByTripId(Long tripId);
}
