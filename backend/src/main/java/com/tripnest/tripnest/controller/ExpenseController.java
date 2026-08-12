package com.tripnest.tripnest.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tripnest.tripnest.dto.BudgetSummaryResponse;
import com.tripnest.tripnest.dto.CreateExpenseRequest;
import com.tripnest.tripnest.dto.ExpenseResponse;
import com.tripnest.tripnest.dto.ExpenseSplitResponse;
import com.tripnest.tripnest.dto.SettlementSummaryResponse;
import com.tripnest.tripnest.dto.UpdateExpenseRequest;
import com.tripnest.tripnest.dto.UserBalanceResponse;
import com.tripnest.tripnest.service.ExpenseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/trips/{tripId}/expenses")
    public ResponseEntity<ExpenseResponse> addExpense(
            @PathVariable Long tripId,
            @Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.ok(expenseService.addExpense(tripId, request));
    }

    @GetMapping("/trips/{tripId}/expenses")
    public ResponseEntity<List<ExpenseResponse>> getTripExpenses(@PathVariable Long tripId) {
        return ResponseEntity.ok(expenseService.getTripExpenses(tripId));
    }

    @GetMapping("/expenses/{expenseId}")
    public ResponseEntity<ExpenseResponse> getExpenseDetails(@PathVariable Long expenseId) {
        return ResponseEntity.ok(expenseService.getExpenseDetails(expenseId));
    }

    @PutMapping("/expenses/{expenseId}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long expenseId,
            @Valid @RequestBody UpdateExpenseRequest request) {
        return ResponseEntity.ok(expenseService.updateExpense(expenseId, request));
    }

    @DeleteMapping("/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long expenseId) {
        expenseService.deleteExpense(expenseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trips/{tripId}/budget-summary")
    public ResponseEntity<BudgetSummaryResponse> getBudgetSummary(@PathVariable Long tripId) {
        return ResponseEntity.ok(expenseService.getBudgetSummary(tripId));
    }

    @GetMapping("/trips/{tripId}/expenses/my-balance")
    public ResponseEntity<UserBalanceResponse> getMyTripBalance(@PathVariable Long tripId) {
        return ResponseEntity.ok(expenseService.getMyTripBalance(tripId));
    }

    @GetMapping("/trips/{tripId}/settlements/summary")
    public ResponseEntity<SettlementSummaryResponse> getSettlementSummary(@PathVariable Long tripId) {
        return ResponseEntity.ok(expenseService.getSettlementSummary(tripId));
    }

    @PatchMapping("/expense-splits/{splitId}/pay")
    public ResponseEntity<ExpenseSplitResponse> markExpenseSplitPaidPatch(@PathVariable Long splitId) {
        return ResponseEntity.ok(expenseService.markExpenseSplitPaid(splitId));
    }

    @PostMapping("/expense-splits/{splitId}/pay")
    public ResponseEntity<ExpenseSplitResponse> markExpenseSplitPaidPost(@PathVariable Long splitId) {
        return ResponseEntity.ok(expenseService.markExpenseSplitPaid(splitId));
    }
}
