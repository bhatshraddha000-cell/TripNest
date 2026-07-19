package com.tripnest.tripnest.repository;

import com.tripnest.tripnest.model.Destination;
import com.tripnest.tripnest.model.DestinationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {

    List<Destination> findByNameContainingIgnoreCase(String name);

    List<Destination> findByCategory(DestinationCategory category);
}