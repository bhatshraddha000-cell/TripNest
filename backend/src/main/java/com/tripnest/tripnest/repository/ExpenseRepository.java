package com.tripnest.tripnest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.Trip;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByTripIdOrderByDateDesc(Long tripId);

    List<Expense> findByTripId(Long tripId);

    List<Expense> findByTripIn(List<Trip> trips);

    void deleteByTripId(Long tripId);
}

