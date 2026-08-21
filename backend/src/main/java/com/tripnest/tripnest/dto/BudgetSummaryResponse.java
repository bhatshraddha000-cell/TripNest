package com.tripnest.tripnest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetSummaryResponse {
    private Double budget;
    private Double estimatedActivities;
    private Double expectedExpense;
    private Double actualExpenses;
    private Double remainingBudget;
}
