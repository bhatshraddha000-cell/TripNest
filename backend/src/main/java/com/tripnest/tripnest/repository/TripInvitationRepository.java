package com.tripnest.tripnest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.TripInvitation;
import com.tripnest.tripnest.model.TripInvitationStatus;
import com.tripnest.tripnest.model.User;

@Repository
public interface TripInvitationRepository extends JpaRepository<TripInvitation, Long> {

    List<TripInvitation> findByReceiverOrderByCreatedAtDesc(User receiver);

    List<TripInvitation> findByReceiverAndStatusOrderByCreatedAtDesc(User receiver, TripInvitationStatus status);

    List<TripInvitation> findByTripId(Long tripId);

    Optional<TripInvitation> findByTripIdAndReceiverIdAndStatus(Long tripId, Long receiverId, TripInvitationStatus status);

    void deleteByTripId(Long tripId);

    void deleteByReceiver(User receiver);

    void deleteBySender(User sender);

    long countByTripIdAndStatus(Long tripId, TripInvitationStatus status);
}

