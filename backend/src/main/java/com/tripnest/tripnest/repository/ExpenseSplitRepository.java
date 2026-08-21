package com.tripnest.tripnest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tripnest.tripnest.model.ExpenseSplit;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    List<ExpenseSplit> findByExpenseId(Long expenseId);

    List<ExpenseSplit> findByExpenseTripId(Long tripId);

    List<ExpenseSplit> findByExpenseTripIdAndUserId(Long tripId, Long userId);

    List<ExpenseSplit> findByUserId(Long userId);

    void deleteByExpenseId(Long expenseId);

    void deleteByExpenseTripId(Long tripId);

    void deleteByUserId(Long userId);
}
