package com.tripnest.tripnest.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.BudgetSummaryResponse;
import com.tripnest.tripnest.dto.CreateExpenseRequest;
import com.tripnest.tripnest.dto.ExpenseResponse;
import com.tripnest.tripnest.dto.ExpenseSplitResponse;
import com.tripnest.tripnest.dto.MemberBalanceDto;
import com.tripnest.tripnest.dto.ParticipantSplitRequest;
import com.tripnest.tripnest.dto.PendingSettlementDto;
import com.tripnest.tripnest.dto.SettlementSummaryResponse;
import com.tripnest.tripnest.dto.UpdateExpenseRequest;
import com.tripnest.tripnest.dto.UserBalanceResponse;
import com.tripnest.tripnest.dto.UserProfileResponse;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.ExpenseSplit;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.PaymentStatus;
import com.tripnest.tripnest.model.SplitType;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
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

    private boolean isTripMember(Long tripId, Long userId, Trip trip) {
        if (trip != null && trip.getUser().getId().equals(userId)) {
            return true;
        }
        return tripMemberRepository.existsByTripIdAndUserId(tripId, userId);
    }

    private ExpenseResponse mapToResponse(Expense exp) {
        UserProfileResponse paidByProfile = UserProfileResponse.builder()
                .userId(exp.getPaidBy().getId())
                .name(exp.getPaidBy().getFullName())
                .fullName(exp.getPaidBy().getFullName())
                .email(exp.getPaidBy().getEmail())
                .profileImage(exp.getPaidBy().getProfileImage())
                .build();

        List<ExpenseSplitResponse> splitResponses = new ArrayList<>();
        if (exp.getSplits() != null) {
            for (ExpenseSplit split : exp.getSplits()) {
                splitResponses.add(ExpenseSplitResponse.builder()
                        .id(split.getId())
                        .expenseId(exp.getId())
                        .userId(split.getUser().getId())
                        .name(split.getUser().getFullName())
                        .email(split.getUser().getEmail())
                        .profileImage(split.getUser().getProfileImage())
                        .shareAmount(split.getShareAmount())
                        .paymentStatus(split.getPaymentStatus())
                        .paidAt(split.getPaidAt())
                        .build());
            }
        }

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
                .splitType(exp.getSplitType() != null ? exp.getSplitType() : SplitType.EQUAL)
                .participants(splitResponses)
                .createdAt(exp.getCreatedAt())
                .build();
    }

    private List<ExpenseSplit> calculateAndBuildSplits(Expense expense, Trip trip, User paidByUser,
                                                        SplitType splitType, List<Long> participantIds,
                                                        List<ParticipantSplitRequest> customSplits,
                                                        Double totalAmount) {
        if (totalAmount == null || totalAmount <= 0) {
            throw new IllegalArgumentException("Expense amount must be greater than zero.");
        }

        List<ExpenseSplit> splits = new ArrayList<>();
        BigDecimal totalBd = BigDecimal.valueOf(totalAmount).setScale(2, RoundingMode.HALF_UP);

        if (splitType == SplitType.CUSTOM) {
            if (customSplits == null || customSplits.isEmpty()) {
                throw new IllegalArgumentException("At least one participant is required for custom split.");
            }

            BigDecimal sumCustom = BigDecimal.ZERO;
            List<User> targetUsers = new ArrayList<>();
            List<BigDecimal> customAmounts = new ArrayList<>();

            for (ParticipantSplitRequest req : customSplits) {
                if (req.getUserId() == null) {
                    throw new IllegalArgumentException("Participant user ID is required.");
                }
                User user = userRepository.findById(req.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("User not found: " + req.getUserId()));
                if (!isTripMember(trip.getId(), user.getId(), trip)) {
                    throw new IllegalArgumentException("All participants must belong to the trip.");
                }
                if (req.getAmount() == null || req.getAmount() <= 0) {
                    throw new IllegalArgumentException("Custom split share amount must be positive.");
                }
                BigDecimal shareBd = BigDecimal.valueOf(req.getAmount()).setScale(2, RoundingMode.HALF_UP);
                sumCustom = sumCustom.add(shareBd);
                targetUsers.add(user);
                customAmounts.add(shareBd);
            }

            if (sumCustom.compareTo(totalBd) != 0) {
                throw new IllegalArgumentException("The participant shares must equal the total expense amount.");
            }

            for (int i = 0; i < targetUsers.size(); i++) {
                User u = targetUsers.get(i);
                BigDecimal share = customAmounts.get(i);
                boolean isPayer = u.getId().equals(paidByUser.getId());

                splits.add(ExpenseSplit.builder()
                        .expense(expense)
                        .user(u)
                        .shareAmount(share.doubleValue())
                        .paymentStatus(isPayer ? PaymentStatus.PAID : PaymentStatus.PENDING)
                        .paidAt(isPayer ? LocalDateTime.now() : null)
                        .build());
            }
        } else { // EQUAL split
            List<Long> targetUserIds = participantIds;
            if (targetUserIds == null || targetUserIds.isEmpty()) {
                // Default equal split among all trip members if none explicitly specified
                List<TripMember> members = tripMemberRepository.findByTripId(trip.getId());
                targetUserIds = new ArrayList<>();
                for (TripMember m : members) {
                    targetUserIds.add(m.getUser().getId());
                }
                if (!targetUserIds.contains(trip.getUser().getId())) {
                    targetUserIds.add(trip.getUser().getId());
                }
            }

            if (targetUserIds.isEmpty()) {
                throw new IllegalArgumentException("At least one participant is required.");
            }

            List<User> targetUsers = new ArrayList<>();
            for (Long uid : targetUserIds) {
                User user = userRepository.findById(uid)
                        .orElseThrow(() -> new IllegalArgumentException("User not found: " + uid));
                if (!isTripMember(trip.getId(), user.getId(), trip)) {
                    throw new IllegalArgumentException("All participants must belong to the trip.");
                }
                if (!targetUsers.stream().anyMatch(u -> u.getId().equals(uid))) {
                    targetUsers.add(user);
                }
            }

            int n = targetUsers.size();
            BigDecimal baseShare = totalBd.divide(BigDecimal.valueOf(n), 2, RoundingMode.DOWN);
            BigDecimal sumBase = baseShare.multiply(BigDecimal.valueOf(n));
            BigDecimal remainder = totalBd.subtract(sumBase);

            // remainder in cents (e.g. 0.01, 0.02)
            int remainderCents = remainder.multiply(BigDecimal.valueOf(100)).intValue();

            for (int i = 0; i < n; i++) {
                User u = targetUsers.get(i);
                BigDecimal finalShare = baseShare;
                if (i < remainderCents) {
                    finalShare = finalShare.add(new BigDecimal("0.01"));
                }

                boolean isPayer = u.getId().equals(paidByUser.getId());
                splits.add(ExpenseSplit.builder()
                        .expense(expense)
                        .user(u)
                        .shareAmount(finalShare.doubleValue())
                        .paymentStatus(isPayer ? PaymentStatus.PAID : PaymentStatus.PENDING)
                        .paidAt(isPayer ? LocalDateTime.now() : null)
                        .build());
            }
        }

        return splits;
    }

    @Transactional
    public ExpenseResponse addExpense(Long tripId, CreateExpenseRequest request) {
        User authenticatedUser = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!isTripMember(tripId, authenticatedUser.getId(), trip)) {
            throw new SecurityException("You are not a member of this trip");
        }

        User paidByUser = authenticatedUser;
        if (request.getPaidById() != null) {
            paidByUser = userRepository.findById(request.getPaidById())
                    .orElseThrow(() -> new IllegalArgumentException("Paid-by user not found"));
            if (!isTripMember(tripId, paidByUser.getId(), trip)) {
                throw new IllegalArgumentException("Paid-by user must belong to the trip.");
            }
        }

        Activity activity = null;
        if (request.getActivityId() != null) {
            activity = activityRepository.findById(request.getActivityId()).orElse(null);
        }

        SplitType splitType = request.getSplitType() != null ? request.getSplitType() : SplitType.EQUAL;

        Expense expense = Expense.builder()
                .trip(trip)
                .activity(activity)
                .paidBy(paidByUser)
                .title(request.getTitle())
                .category(request.getCategory())
                .amount(request.getAmount())
                .date(request.getDate())
                .notes(request.getNotes())
                .splitType(splitType)
                .splits(new ArrayList<>())
                .build();

        List<ExpenseSplit> splits = calculateAndBuildSplits(expense, trip, paidByUser, splitType,
                request.getParticipantIds(), request.getCustomSplits(), request.getAmount());

        expense.getSplits().addAll(splits);

        Expense saved = expenseRepository.save(expense);

        // Send notifications
        List<TripMember> members = tripMemberRepository.findByTripId(tripId);
        String msg = paidByUser.getFullName() + " added ₹" + request.getAmount().intValue() + " for " + request.getTitle() + ".";
        for (TripMember m : members) {
            if (!m.getUser().getId().equals(authenticatedUser.getId())) {
                notificationService.createNotification(m.getUser(), "Expense Added", msg, "EXPENSE_ADDED");
            }
        }

        activityLogService.logActivity(authenticatedUser, "TRIP", tripId, "EXPENSE_ADDED", "Expense Added", "Added expense \"" + request.getTitle() + "\" of ₹" + request.getAmount());

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getTripExpenses(Long tripId) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!isTripMember(tripId, user.getId(), trip)) {
            throw new SecurityException("Access denied to trip expenses");
        }

        List<Expense> expenses = expenseRepository.findByTripIdOrderByDateDesc(tripId);
        return expenses.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseDetails(Long expenseId) {
        User user = getAuthenticatedUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!isTripMember(expense.getTrip().getId(), user.getId(), expense.getTrip())) {
            throw new SecurityException("Access denied to expense details");
        }

        return mapToResponse(expense);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long expenseId, UpdateExpenseRequest request) {
        User user = getAuthenticatedUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        Trip trip = expense.getTrip();
        if (!isTripMember(trip.getId(), user.getId(), trip)) {
            throw new SecurityException("You are not a member of this trip");
        }

        boolean isUploader = expense.getPaidBy().getId().equals(user.getId());
        boolean isGroupAdmin = false;
        var memberOpt = tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId());
        if (memberOpt.isPresent() && memberOpt.get().getTripRole() == TripMemberRole.GROUP_ADMIN) {
            isGroupAdmin = true;
        } else if (trip.getUser().getId().equals(user.getId())) {
            isGroupAdmin = true;
        }

        if (!isUploader && !isGroupAdmin) {
            throw new SecurityException("Only uploader or Group Admin can update this expense");
        }

        User paidByUser = expense.getPaidBy();
        if (request.getPaidById() != null) {
            paidByUser = userRepository.findById(request.getPaidById())
                    .orElseThrow(() -> new IllegalArgumentException("Paid-by user not found"));
            if (!isTripMember(trip.getId(), paidByUser.getId(), trip)) {
                throw new IllegalArgumentException("Paid-by user must belong to the trip.");
            }
        }

        Activity activity = null;
        if (request.getActivityId() != null) {
            activity = activityRepository.findById(request.getActivityId()).orElse(null);
        }

        SplitType splitType = request.getSplitType() != null ? request.getSplitType() : SplitType.EQUAL;

        expense.setActivity(activity);
        expense.setTitle(request.getTitle());
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setNotes(request.getNotes());
        expense.setPaidBy(paidByUser);
        expense.setSplitType(splitType);

        // Recalculate splits
        expense.getSplits().clear();
        List<ExpenseSplit> newSplits = calculateAndBuildSplits(expense, trip, paidByUser, splitType,
                request.getParticipantIds(), request.getCustomSplits(), request.getAmount());
        expense.getSplits().addAll(newSplits);

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
        if (!isTripMember(trip.getId(), user.getId(), trip)) {
            throw new SecurityException("You are not a member of this trip");
        }

        boolean isUploader = expense.getPaidBy().getId().equals(user.getId());
        boolean isGroupAdmin = false;
        var memberOpt = tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId());
        if (memberOpt.isPresent() && memberOpt.get().getTripRole() == TripMemberRole.GROUP_ADMIN) {
            isGroupAdmin = true;
        } else if (trip.getUser().getId().equals(user.getId())) {
            isGroupAdmin = true;
        }

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

        if (!isTripMember(tripId, user.getId(), trip)) {
            throw new SecurityException("Access denied to budget summary");
        }

        List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDateAscDayNumberAsc(tripId);
        double estimatedCost = 0.0;
        for (Itinerary itinerary : itineraries) {
            for (Activity activity : itinerary.getActivities()) {
                if (activity.getEstimatedCost() != null) {
                    estimatedCost += activity.getEstimatedCost();
                }
            }
        }

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
                .expectedExpense(estimatedCost)
                .actualExpenses(actualExpenses)
                .remainingBudget(remaining)
                .build();
    }

    @Transactional(readOnly = true)
    public UserBalanceResponse getMyTripBalance(Long tripId) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!isTripMember(tripId, user.getId(), trip)) {
            throw new SecurityException("Access denied to trip balance");
        }

        List<ExpenseSplit> allTripSplits = expenseSplitRepository.findByExpenseTripId(tripId);

        double youOwe = 0.0;
        double youShouldReceive = 0.0;

        for (ExpenseSplit split : allTripSplits) {
            if (split.getPaymentStatus() == PaymentStatus.PENDING) {
                Long payerId = split.getExpense().getPaidBy().getId();
                Long debtorId = split.getUser().getId();

                if (debtorId.equals(user.getId()) && !payerId.equals(user.getId())) {
                    youOwe += split.getShareAmount();
                } else if (payerId.equals(user.getId()) && !debtorId.equals(user.getId())) {
                    youShouldReceive += split.getShareAmount();
                }
            }
        }

        double netBalance = youShouldReceive - youOwe;

        return UserBalanceResponse.builder()
                .youOwe(youOwe)
                .youShouldReceive(youShouldReceive)
                .netBalance(netBalance)
                .build();
    }

    @Transactional(readOnly = true)
    public SettlementSummaryResponse getSettlementSummary(Long tripId) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!isTripMember(tripId, user.getId(), trip)) {
            throw new SecurityException("Access denied to settlement summary");
        }

        List<Expense> expenses = expenseRepository.findByTripId(tripId);
        List<ExpenseSplit> allTripSplits = expenseSplitRepository.findByExpenseTripId(tripId);

        double totalExpenses = 0.0;
        for (Expense e : expenses) {
            if (e.getAmount() != null) {
                totalExpenses += e.getAmount();
            }
        }

        double totalPending = 0.0;
        double totalSettled = 0.0;

        List<PendingSettlementDto> pendingSettlements = new ArrayList<>();
        List<PendingSettlementDto> completedSettlements = new ArrayList<>();

        for (ExpenseSplit split : allTripSplits) {
            Long payerId = split.getExpense().getPaidBy().getId();
            Long debtorId = split.getUser().getId();

            if (!payerId.equals(debtorId)) {
                PendingSettlementDto dto = PendingSettlementDto.builder()
                        .splitId(split.getId())
                        .expenseId(split.getExpense().getId())
                        .expenseTitle(split.getExpense().getTitle())
                        .payerId(debtorId)
                        .payerName(split.getUser().getFullName())
                        .receiverId(payerId)
                        .receiverName(split.getExpense().getPaidBy().getFullName())
                        .amount(split.getShareAmount())
                        .date(split.getExpense().getDate())
                        .paymentStatus(split.getPaymentStatus())
                        .paidAt(split.getPaidAt())
                        .build();

                if (split.getPaymentStatus() == PaymentStatus.PENDING) {
                    totalPending += split.getShareAmount();
                    pendingSettlements.add(dto);
                } else {
                    totalSettled += split.getShareAmount();
                    completedSettlements.add(dto);
                }
            } else {
                totalSettled += split.getShareAmount();
            }
        }

        // Member Balances logic
        List<TripMember> tripMembers = tripMemberRepository.findByTripId(tripId);
        Map<Long, User> allMemberUsers = new LinkedHashMap<>();
        for (TripMember tm : tripMembers) {
            allMemberUsers.put(tm.getUser().getId(), tm.getUser());
        }
        if (!allMemberUsers.containsKey(trip.getUser().getId())) {
            allMemberUsers.put(trip.getUser().getId(), trip.getUser());
        }

        Map<Long, Double> memberOwesMap = new HashMap<>();
        Map<Long, Double> memberReceivesMap = new HashMap<>();

        for (Long uid : allMemberUsers.keySet()) {
            memberOwesMap.put(uid, 0.0);
            memberReceivesMap.put(uid, 0.0);
        }

        for (ExpenseSplit split : allTripSplits) {
            if (split.getPaymentStatus() == PaymentStatus.PENDING) {
                Long payerId = split.getExpense().getPaidBy().getId();
                Long debtorId = split.getUser().getId();

                if (!payerId.equals(debtorId)) {
                    memberOwesMap.put(debtorId, memberOwesMap.getOrDefault(debtorId, 0.0) + split.getShareAmount());
                    memberReceivesMap.put(payerId, memberReceivesMap.getOrDefault(payerId, 0.0) + split.getShareAmount());
                }
            }
        }

        List<MemberBalanceDto> memberDtos = new ArrayList<>();
        for (Map.Entry<Long, User> entry : allMemberUsers.entrySet()) {
            Long uid = entry.getKey();
            User u = entry.getValue();
            double owes = memberOwesMap.getOrDefault(uid, 0.0);
            double receives = memberReceivesMap.getOrDefault(uid, 0.0);
            double net = receives - owes;

            memberDtos.add(MemberBalanceDto.builder()
                    .userId(uid)
                    .name(u.getFullName())
                    .email(u.getEmail())
                    .profileImage(u.getProfileImage())
                    .youOwe(owes)
                    .youShouldReceive(receives)
                    .netBalance(net)
                    .build());
        }

        return SettlementSummaryResponse.builder()
                .totalExpenses(totalExpenses)
                .totalPending(totalPending)
                .totalSettled(totalSettled)
                .members(memberDtos)
                .pendingSettlements(pendingSettlements)
                .completedSettlements(completedSettlements)
                .build();
    }

    @Transactional
    public ExpenseSplitResponse markExpenseSplitPaid(Long splitId) {
        User currentUser = getAuthenticatedUser();
        ExpenseSplit split = expenseSplitRepository.findById(splitId)
                .orElseThrow(() -> new IllegalArgumentException("Expense split not found"));

        Expense expense = split.getExpense();
        Trip trip = expense.getTrip();

        if (!isTripMember(trip.getId(), currentUser.getId(), trip)) {
            throw new SecurityException("Access denied to trip expense split");
        }

        boolean isDebtor = split.getUser().getId().equals(currentUser.getId());
        boolean isCreditor = expense.getPaidBy().getId().equals(currentUser.getId());
        boolean isGroupAdmin = false;
        var memberOpt = tripMemberRepository.findByTripIdAndUserId(trip.getId(), currentUser.getId());
        if (memberOpt.isPresent() && memberOpt.get().getTripRole() == TripMemberRole.GROUP_ADMIN) {
            isGroupAdmin = true;
        } else if (trip.getUser().getId().equals(currentUser.getId())) {
            isGroupAdmin = true;
        }

        if (!isDebtor && !isCreditor && !isGroupAdmin) {
            throw new SecurityException("Only the debtor, creditor, or Group Admin can mark a split share as paid.");
        }

        if (split.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("Expense split is already marked as paid.");
        }

        split.setPaymentStatus(PaymentStatus.PAID);
        split.setPaidAt(LocalDateTime.now());

        ExpenseSplit saved = expenseSplitRepository.save(split);

        // Activity log
        activityLogService.logActivity(currentUser, "TRIP", trip.getId(), "EXPENSE_SETTLED", "Expense Settled",
                currentUser.getFullName() + " marked share of ₹" + split.getShareAmount() + " as paid for \"" + expense.getTitle() + "\"");

        // Notification to creditor (or debtor)
        User creditor = expense.getPaidBy();
        if (!currentUser.getId().equals(creditor.getId())) {
            String msg = currentUser.getFullName() + " settled ₹" + split.getShareAmount().intValue() + " for " + expense.getTitle() + ".";
            notificationService.createNotification(creditor, "Settlement Paid", msg, "EXPENSE_SETTLED");
        }

        return ExpenseSplitResponse.builder()
                .id(saved.getId())
                .expenseId(expense.getId())
                .userId(saved.getUser().getId())
                .name(saved.getUser().getFullName())
                .email(saved.getUser().getEmail())
                .profileImage(saved.getUser().getProfileImage())
                .shareAmount(saved.getShareAmount())
                .paymentStatus(saved.getPaymentStatus())
                .paidAt(saved.getPaidAt())
                .build();
    }
}
