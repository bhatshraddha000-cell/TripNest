package com.tripnest.tripnest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Feedback;

import com.tripnest.tripnest.model.User;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findTop3ByOrderByCreatedAtDesc();

    void deleteByUser(User user);
}
