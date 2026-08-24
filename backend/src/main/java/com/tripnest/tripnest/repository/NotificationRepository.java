package com.tripnest.tripnest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Notification;
import com.tripnest.tripnest.model.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByReceiverOrderByCreatedAtDesc(User receiver);

    List<Notification> findTop5ByReceiverOrderByCreatedAtDesc(User receiver);

    long countByReceiverAndIsReadFalse(User receiver);

    void deleteByReceiver(User receiver);
}
