package com.tripnest.tripnest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByTripIdOrderByUploadedAtDesc(Long tripId);

    void deleteByTripId(Long tripId);
}

