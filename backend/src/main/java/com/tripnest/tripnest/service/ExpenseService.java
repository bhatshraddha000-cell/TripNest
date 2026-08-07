package com.tripnest.tripnest.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.BudgetSummaryResponse;
import com.tripnest.tripnest.dto.CreateExpenseRequest;
import com.tripnest.tripnest.dto.ExpenseResponse;
import com.tripnest.tripnest.dto.UpdateExpenseRequest;
import com.tripnest.tripnest.dto.UserProfileResponse;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;
    private final ItineraryRepository itineraryRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private ExpenseResponse mapToResponse(Expense exp) {
        UserProfileResponse paidByProfile = UserProfileResponse.builder()
                .userId(exp.getPaidBy().getId())
                .name(exp.getPaidBy().getFullName())
                .fullName(exp.getPaidBy().getFullName())
                .email(exp.getPaidBy().getEmail())
                .profileImage(exp.getPaidBy().getProfileImage())
                .build();

        return ExpenseResponse.builder()
                .id(exp.getId())
                .tripId(exp.getTrip().getId())
                .activityId(exp.getActivity() != null ? exp.getActivity().getId() : null)
                .activityTitle(exp.getActivity() != null ? exp.getActivity().getTitle() : null)
                .paidBy(paidByProfile)
                .title(exp.getTitle())
                .category(exp.getCategory())
                .amount(exp.getAmount())
                .date(exp.getDate())
                .notes(exp.getNotes())
                .createdAt(exp.getCreatedAt())
                .build();
    }

    @Transactional
    public ExpenseResponse addExpense(Long tripId, CreateExpenseRequest request) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        // Verify member of trip
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            if (!trip.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Only trip members can add expenses");
            }
        }

        Activity activity = null;
        if (request.getActivityId() != null) {
            activity = activityRepository.findById(request.getActivityId())
                    .orElse(null);
        }

        Expense expense = Expense.builder()
                .trip(trip)
                .activity(activity)
                .paidBy(user)
                .title(request.getTitle())
                .category(request.getCategory())
                .amount(request.getAmount())
                .date(request.getDate())
                .notes(request.getNotes())
                .build();

        Expense saved = expenseRepository.save(expense);

        // Notify other members
        List<TripMember> members = tripMemberRepository.findByTripId(tripId);
        String msg = user.getFullName() + " added ₹" + request.getAmount().intValue() + " for " + request.getTitle() + ".";
        for (TripMember m : members) {
            if (!m.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(m.getUser(), "Expense Added", msg, "EXPENSE_ADDED");
            }
        }

        activityLogService.logActivity(user, "TRIP", tripId, "EXPENSE_ADDED", "Expense Added", "Added expense \"" + request.getTitle() + "\" of ₹" + request.getAmount());

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getTripExpenses(Long tripId) {
        User user = getAuthenticatedUser();
        
        // Verify member of trip
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new IllegalArgumentException("Trip not found"));
            if (!trip.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Access denied to trip expenses");
            }
        }

        List<Expense> expenses = expenseRepository.findByTripIdOrderByDateDesc(tripId);
        return expenses.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public ExpenseResponse updateExpense(Long expenseId, UpdateExpenseRequest request) {
        User user = getAuthenticatedUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        Trip trip = expense.getTrip();
        TripMember member = tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId())
                .orElseThrow(() -> new SecurityException("You are not a member of this trip"));

        // Only paidBy uploader or GROUP_ADMIN can update
        boolean isUploader = expense.getPaidBy().getId().equals(user.getId());
        boolean isGroupAdmin = member.getTripRole() == TripMemberRole.GROUP_ADMIN;
        if (!isUploader && !isGroupAdmin) {
            throw new SecurityException("Only uploader or Group Admin can update this expense");
        }

        Activity activity = null;
        if (request.getActivityId() != null) {
            activity = activityRepository.findById(request.getActivityId()).orElse(null);
        }

        expense.setActivity(activity);
        expense.setTitle(request.getTitle());
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setNotes(request.getNotes());

        Expense saved = expenseRepository.save(expense);
        activityLogService.logActivity(user, "TRIP", trip.getId(), "EXPENSE_UPDATED", "Expense Updated", "Updated expense \"" + request.getTitle() + "\"");

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        User user = getAuthenticatedUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        Trip trip = expense.getTrip();
        TripMember member = tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId())
                .orElseThrow(() -> new SecurityException("You are not a member of this trip"));

        // Only paidBy uploader or GROUP_ADMIN can delete
        boolean isUploader = expense.getPaidBy().getId().equals(user.getId());
        boolean isGroupAdmin = member.getTripRole() == TripMemberRole.GROUP_ADMIN;
        if (!isUploader && !isGroupAdmin) {
            throw new SecurityException("Only uploader or Group Admin can delete this expense");
        }

        expenseRepository.delete(expense);
        activityLogService.logActivity(user, "TRIP", trip.getId(), "EXPENSE_DELETED", "Expense Deleted", "Deleted expense \"" + expense.getTitle() + "\"");
    }

    @Transactional(readOnly = true)
    public BudgetSummaryResponse getBudgetSummary(Long tripId) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        // Verify member
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            if (!trip.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Access denied to budget summary");
            }
        }

        // Sum of all activities estimated costs
        List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDateAscDayNumberAsc(tripId);
        double estimatedCost = 0.0;
        for (Itinerary itinerary : itineraries) {
            for (Activity activity : itinerary.getActivities()) {
                if (activity.getEstimatedCost() != null) {
                    estimatedCost += activity.getEstimatedCost();
                }
            }
        }

        // Sum of actual expenses
        List<Expense> expenses = expenseRepository.findByTripId(tripId);
        double actualExpenses = 0.0;
        for (Expense expense : expenses) {
            if (expense.getAmount() != null) {
                actualExpenses += expense.getAmount();
            }
        }

        double budget = trip.getBudget() != null ? trip.getBudget() : 0.0;
        double remaining = budget - actualExpenses;

        return BudgetSummaryResponse.builder()
                .budget(budget)
                .estimatedActivities(estimatedCost)
                .actualExpenses(actualExpenses)
                .remainingBudget(remaining)
                .build();
    }
}
