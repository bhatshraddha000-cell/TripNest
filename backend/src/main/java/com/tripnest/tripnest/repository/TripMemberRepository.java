package com.tripnest.tripnest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.User;

@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, Long> {

    List<TripMember> findByTripId(Long tripId);

    List<TripMember> findByUser(User user);

    Optional<TripMember> findByTripIdAndUserId(Long tripId, Long userId);

    boolean existsByTripIdAndUserId(Long tripId, Long userId);

    void deleteByTripIdAndUserId(Long tripId, Long userId);

    void deleteByTripId(Long tripId);

    long countByTripId(Long tripId);
}

