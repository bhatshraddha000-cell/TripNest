package com.tripnest.tripnest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.ActivityLog;
import com.tripnest.tripnest.model.User;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findTop3ByUserOrderByCreatedAtDesc(User user);

    List<ActivityLog> findTop5ByUserOrderByCreatedAtDesc(User user);

    List<ActivityLog> findTop10ByUserOrderByCreatedAtDesc(User user);

    long countByUser(User user);

    Optional<ActivityLog> findTopByUserOrderByCreatedAtAsc(User user);

    void deleteByUser(User user);
}
