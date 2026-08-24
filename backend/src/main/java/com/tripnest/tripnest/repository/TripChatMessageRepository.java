package com.tripnest.tripnest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.TripChatMessage;

@Repository
public interface TripChatMessageRepository extends JpaRepository<TripChatMessage, Long> {

    List<TripChatMessage> findByTripIdOrderByCreatedAtAsc(Long tripId);

    void deleteByTripId(Long tripId);

    void deleteBySenderId(Long senderId);
}
