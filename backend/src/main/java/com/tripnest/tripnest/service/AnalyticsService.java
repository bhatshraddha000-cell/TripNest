package com.tripnest.tripnest.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.AdminAnalyticsResponse;
import com.tripnest.tripnest.dto.AnalyticsResponse;
import com.tripnest.tripnest.dto.AdminUserListResponse;
import com.tripnest.tripnest.dto.AdminTripListResponse;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Document;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.ExpenseSplit;
import com.tripnest.tripnest.model.Notification;
import com.tripnest.tripnest.model.PaymentStatus;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.DocumentRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.NotificationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final ActivityRepository activityRepository;
    private final DocumentRepository documentRepository;
    private final NotificationRepository notificationRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getTravelerAnalytics() {
        return getTravelerAnalytics(null);
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getTravelerAnalytics(Long tripId) {
        User user = getAuthenticatedUser();
        LocalDate today = LocalDate.now();

        if (tripId != null) {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new com.tripnest.tripnest.exception.TripNotFoundException("Trip not found"));

            boolean isMember = trip.getUser().getId().equals(user.getId()) 
                    || tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId());
            if (!isMember) {
                throw new SecurityException("Access denied: You are not a member of this trip");
            }

            long totalTrips = 1;
            long upcomingTrips = 0;
            long ongoingTrips = 0;
            long completedTrips = 0;
            Map<String, Long> tripsByStatusMap = new HashMap<>();
            tripsByStatusMap.put("UPCOMING", 0L);
            tripsByStatusMap.put("ONGOING", 0L);
            tripsByStatusMap.put("COMPLETED", 0L);

            LocalDate start = trip.getStartDate();
            LocalDate end = trip.getEndDate();
            if (start != null && start.isAfter(today)) {
                upcomingTrips = 1;
                tripsByStatusMap.put("UPCOMING", 1L);
            } else if (start != null && end != null && !start.isAfter(today) && !end.isBefore(today)) {
                ongoingTrips = 1;
                tripsByStatusMap.put("ONGOING", 1L);
            } else if (end != null && end.isBefore(today)) {
                completedTrips = 1;
                tripsByStatusMap.put("COMPLETED", 1L);
            }

            double totalBudget = trip.getBudget() != null ? trip.getBudget() : 0.0;

            List<Activity> activities = activityRepository.findByItineraryTripIn(List.of(trip));
            long totalActivities = activities.size();
            double totalEstimatedCost = activities.stream()
                    .mapToDouble(a -> a.getEstimatedCost() != null ? a.getEstimatedCost() : 0.0)
                    .sum();

            long totalDestinations = (trip.getDestination() != null && !trip.getDestination().trim().isEmpty()) ? 1 : 0;

            List<Expense> expenses = expenseRepository.findByTripId(trip.getId());
            double totalSpent = expenses.stream()
                    .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                    .sum();

            double remainingBudget = totalBudget - totalSpent;
            double budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100.0 : 0.0;

            Map<String, Double> expenseByCategory = new HashMap<>();
            Map<String, Double> spendingByTrip = new HashMap<>();

            for (Expense expense : expenses) {
                String category = expense.getCategory();
                if (category == null || category.trim().isEmpty()) {
                    category = "Miscellaneous";
                }
                expenseByCategory.put(category, expenseByCategory.getOrDefault(category, 0.0) + expense.getAmount());
            }
            spendingByTrip.put(trip.getTitle(), totalSpent);

            List<ExpenseSplit> userSplits = expenseSplitRepository.findByUserId(user.getId());
            double amountPaidByCurrentUser = expenses.stream()
                    .filter(e -> e.getPaidBy().getId().equals(user.getId()))
                    .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                    .sum();

            double amountOwedByCurrentUser = 0.0;
            double amountToReceive = 0.0;
            double settledAmount = 0.0;
            double pendingAmount = 0.0;

            for (ExpenseSplit split : userSplits) {
                if (split.getExpense().getTrip().getId().equals(trip.getId())) {
                    if (split.getPaymentStatus() == PaymentStatus.PAID) {
                        settledAmount += split.getShareAmount();
                    } else if (split.getPaymentStatus() == PaymentStatus.PENDING) {
                        pendingAmount += split.getShareAmount();
                        
                        if (!split.getExpense().getPaidBy().getId().equals(user.getId())) {
                            amountOwedByCurrentUser += split.getShareAmount();
                        }
                    }
                }
            }

            List<ExpenseSplit> allActiveTripSplits = expenseSplitRepository.findAll().stream()
                    .filter(split -> split.getExpense().getTrip().getId().equals(trip.getId()))
                    .toList();

            for (ExpenseSplit split : allActiveTripSplits) {
                if (split.getExpense().getPaidBy().getId().equals(user.getId()) 
                        && !split.getUser().getId().equals(user.getId())
                        && split.getPaymentStatus() == PaymentStatus.PENDING) {
                    amountToReceive += split.getShareAmount();
                }
            }

            List<AnalyticsResponse.FavoriteDestinationDto> favoriteDestinations = new ArrayList<>();
            if (trip.getDestination() != null && !trip.getDestination().trim().isEmpty()) {
                favoriteDestinations.add(AnalyticsResponse.FavoriteDestinationDto.builder()
                        .destination(trip.getDestination())
                        .tripCount(1)
                        .build());
            }

            return AnalyticsResponse.builder()
                    .totalTrips(totalTrips)
                    .upcomingTrips(upcomingTrips)
                    .ongoingTrips(ongoingTrips)
                    .completedTrips(completedTrips)
                    .totalBudget(totalBudget)
                    .totalEstimatedCost(totalEstimatedCost)
                    .totalSpent(totalSpent)
                    .remainingBudget(remainingBudget)
                    .budgetUtilization(budgetUtilization)
                    .totalActivities(totalActivities)
                    .totalDestinations(totalDestinations)
                    .expenseByCategory(expenseByCategory)
                    .tripsByStatus(tripsByStatusMap)
                    .spendingByTrip(spendingByTrip)
                    .favoriteDestinations(favoriteDestinations)
                    .totalExpensesCount(expenses.size())
                    .totalAmountSpent(totalSpent)
                    .amountPaidByCurrentUser(amountPaidByCurrentUser)
                    .amountOwedByCurrentUser(amountOwedByCurrentUser)
                    .amountToReceive(amountToReceive)
                    .settledAmount(settledAmount)
                    .pendingAmount(pendingAmount)
                    .build();
        }

        // 1. Get all trips the user is a member of (excludes CANCELLED)
        List<TripMember> memberships = tripMemberRepository.findByUser(user);
        List<Trip> userTrips = memberships.stream()
                .map(TripMember::getTrip)
                .filter(t -> t.getStatus() != TripStatus.CANCELLED)
                .toList();

        long totalTrips = userTrips.size();
        long upcomingTrips = 0;
        long ongoingTrips = 0;
        long completedTrips = 0;

        double totalBudget = 0.0;
        Map<String, Long> tripsByStatusMap = new HashMap<>();
        tripsByStatusMap.put("UPCOMING", 0L);
        tripsByStatusMap.put("ONGOING", 0L);
        tripsByStatusMap.put("COMPLETED", 0L);

        for (Trip trip : userTrips) {
            LocalDate start = trip.getStartDate();
            LocalDate end = trip.getEndDate();

            if (start != null && start.isAfter(today)) {
                upcomingTrips++;
                tripsByStatusMap.put("UPCOMING", tripsByStatusMap.get("UPCOMING") + 1);
            } else if (start != null && end != null && !start.isAfter(today) && !end.isBefore(today)) {
                ongoingTrips++;
                tripsByStatusMap.put("ONGOING", tripsByStatusMap.get("ONGOING") + 1);
            } else if (end != null && end.isBefore(today)) {
                completedTrips++;
                tripsByStatusMap.put("COMPLETED", tripsByStatusMap.get("COMPLETED") + 1);
            }

            if (trip.getBudget() != null) {
                totalBudget += trip.getBudget();
            }
        }

        // 2. Activities & Destinations
        long totalActivities = 0;
        double totalEstimatedCost = 0.0;
        if (!userTrips.isEmpty()) {
            List<Activity> activities = activityRepository.findByItineraryTripIn(userTrips);
            totalActivities = activities.size();
            totalEstimatedCost = activities.stream()
                    .mapToDouble(a -> a.getEstimatedCost() != null ? a.getEstimatedCost() : 0.0)
                    .sum();
        }

        Set<String> uniqueDestinations = userTrips.stream()
                .map(Trip::getDestination)
                .filter(d -> d != null && !d.trim().isEmpty())
                .collect(Collectors.toSet());
        long totalDestinations = uniqueDestinations.size();

        // 3. Expenses & Splits
        List<Expense> expenses = userTrips.isEmpty() ? List.of() : expenseRepository.findByTripIn(userTrips);
        double totalSpent = expenses.stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();

        double remainingBudget = totalBudget - totalSpent;
        double budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100.0 : 0.0;

        // Categories breakdown
        Map<String, Double> expenseByCategory = new HashMap<>();
        Map<String, Double> spendingByTrip = new HashMap<>();

        for (Expense expense : expenses) {
            String category = expense.getCategory();
            if (category == null || category.trim().isEmpty()) {
                category = "Miscellaneous";
            }
            expenseByCategory.put(category, expenseByCategory.getOrDefault(category, 0.0) + expense.getAmount());

            String tripTitle = expense.getTrip().getTitle();
            spendingByTrip.put(tripTitle, spendingByTrip.getOrDefault(tripTitle, 0.0) + expense.getAmount());
        }

        // Split statistics
        List<ExpenseSplit> userSplits = expenseSplitRepository.findByUserId(user.getId());
        double amountPaidByCurrentUser = expenses.stream()
                .filter(e -> e.getPaidBy().getId().equals(user.getId()))
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();

        double amountOwedByCurrentUser = 0.0;
        double amountToReceive = 0.0;
        double settledAmount = 0.0;
        double pendingAmount = 0.0;

        // Calculate settled / pending splits involving the current user
        for (ExpenseSplit split : userSplits) {
            // Check if the split belongs to one of the user's active trips
            if (userTrips.contains(split.getExpense().getTrip())) {
                if (split.getPaymentStatus() == PaymentStatus.PAID) {
                    settledAmount += split.getShareAmount();
                } else if (split.getPaymentStatus() == PaymentStatus.PENDING) {
                    pendingAmount += split.getShareAmount();
                    
                    // If current user is debtor, and NOT the payer
                    if (!split.getExpense().getPaidBy().getId().equals(user.getId())) {
                        amountOwedByCurrentUser += split.getShareAmount();
                    }
                }
            }
        }

        // Calculate amount to receive (splits where user paid, but others owe)
        if (!userTrips.isEmpty()) {
            List<ExpenseSplit> allActiveTripSplits = expenseSplitRepository.findAll().stream()
                    .filter(split -> userTrips.contains(split.getExpense().getTrip()))
                    .toList();

            for (ExpenseSplit split : allActiveTripSplits) {
                if (split.getExpense().getPaidBy().getId().equals(user.getId()) 
                        && !split.getUser().getId().equals(user.getId())
                        && split.getPaymentStatus() == PaymentStatus.PENDING) {
                    amountToReceive += split.getShareAmount();
                }
            }
        }

        // Favorite Destinations
        Map<String, Long> destinationCount = new HashMap<>();
        for (Trip trip : userTrips) {
            String dest = trip.getDestination();
            if (dest != null && !dest.trim().isEmpty()) {
                destinationCount.put(dest, destinationCount.getOrDefault(dest, 0L) + 1);
            }
        }
        List<AnalyticsResponse.FavoriteDestinationDto> favoriteDestinations = destinationCount.entrySet().stream()
                .map(entry -> AnalyticsResponse.FavoriteDestinationDto.builder()
                        .destination(entry.getKey())
                        .tripCount(entry.getValue())
                        .build())
                .sorted((d1, d2) -> Long.compare(d2.getTripCount(), d1.getTripCount()))
                .limit(5)
                .toList();

        return AnalyticsResponse.builder()
                .totalTrips(totalTrips)
                .upcomingTrips(upcomingTrips)
                .ongoingTrips(ongoingTrips)
                .completedTrips(completedTrips)
                .totalBudget(totalBudget)
                .totalEstimatedCost(totalEstimatedCost)
                .totalSpent(totalSpent)
                .remainingBudget(remainingBudget)
                .budgetUtilization(budgetUtilization)
                .totalActivities(totalActivities)
                .totalDestinations(totalDestinations)
                .expenseByCategory(expenseByCategory)
                .tripsByStatus(tripsByStatusMap)
                .spendingByTrip(spendingByTrip)
                .favoriteDestinations(favoriteDestinations)
                .totalExpensesCount(expenses.size())
                .totalAmountSpent(totalSpent)
                .amountPaidByCurrentUser(amountPaidByCurrentUser)
                .amountOwedByCurrentUser(amountOwedByCurrentUser)
                .amountToReceive(amountToReceive)
                .settledAmount(settledAmount)
                .pendingAmount(pendingAmount)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAdminAnalytics() {
        return getAdminAnalytics("ALL", "ALL", "ALL");
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAdminAnalytics(String dateRange, String tripStatus, String destination) {
        LocalDate today = LocalDate.now();

        // 1. Parse date filter
        LocalDateTime rangeStart = null;
        if ("last7days".equalsIgnoreCase(dateRange)) {
            rangeStart = LocalDateTime.now().minusDays(7);
        } else if ("last30days".equalsIgnoreCase(dateRange)) {
            rangeStart = LocalDateTime.now().minusDays(30);
        } else if ("last3months".equalsIgnoreCase(dateRange)) {
            rangeStart = LocalDateTime.now().minusMonths(3);
        } else if ("last6months".equalsIgnoreCase(dateRange)) {
            rangeStart = LocalDateTime.now().minusMonths(6);
        } else if ("lastyear".equalsIgnoreCase(dateRange)) {
            rangeStart = LocalDateTime.now().minusYears(1);
        }
        final LocalDateTime finalRangeStart = rangeStart;

        // Fetch all data
        List<User> allUsers = userRepository.findAll();
        List<Trip> allTrips = tripRepository.findAll();
        List<TripMember> allMembers = tripMemberRepository.findAll();
        List<Activity> allActivities = activityRepository.findAll();
        List<Expense> allExpenses = expenseRepository.findAll();
        List<Document> allDocuments = documentRepository.findAll();
        List<Notification> allNotifications = notificationRepository.findAll();

        // Filter collections
        List<User> filteredUsers = allUsers.stream()
                .filter(u -> finalRangeStart == null || (u.getCreatedAt() != null && u.getCreatedAt().isAfter(finalRangeStart)))
                .toList();

        List<Trip> filteredTrips = allTrips.stream()
                .filter(t -> finalRangeStart == null || (t.getCreatedAt() != null && t.getCreatedAt().isAfter(finalRangeStart)))
                .filter(t -> "ALL".equalsIgnoreCase(tripStatus) || (t.getStatus() != null && t.getStatus().name().equalsIgnoreCase(tripStatus)))
                .filter(t -> "ALL".equalsIgnoreCase(destination) || (t.getDestination() != null && t.getDestination().equalsIgnoreCase(destination)))
                .toList();

        List<TripMember> filteredMembers = allMembers.stream()
                .filter(tm -> finalRangeStart == null || (tm.getJoinedAt() != null && tm.getJoinedAt().isAfter(finalRangeStart)))
                .filter(tm -> "ALL".equalsIgnoreCase(destination) || (tm.getTrip() != null && tm.getTrip().getDestination() != null && tm.getTrip().getDestination().equalsIgnoreCase(destination)))
                .toList();

        List<Expense> filteredExpenses = allExpenses.stream()
                .filter(e -> finalRangeStart == null || (e.getCreatedAt() != null && e.getCreatedAt().isAfter(finalRangeStart)))
                .filter(e -> "ALL".equalsIgnoreCase(destination) || (e.getTrip() != null && e.getTrip().getDestination() != null && e.getTrip().getDestination().equalsIgnoreCase(destination)))
                .toList();

        List<Activity> filteredActivities = allActivities.stream()
                .filter(a -> finalRangeStart == null || (a.getCreatedAt() != null && a.getCreatedAt().isAfter(finalRangeStart)))
                .filter(a -> "ALL".equalsIgnoreCase(destination) || (a.getItinerary() != null && a.getItinerary().getTrip() != null && a.getItinerary().getTrip().getDestination() != null && a.getItinerary().getTrip().getDestination().equalsIgnoreCase(destination)))
                .toList();

        List<Document> filteredDocuments = allDocuments.stream()
                .filter(d -> finalRangeStart == null || (d.getUploadedAt() != null && d.getUploadedAt().isAfter(finalRangeStart)))
                .filter(d -> "ALL".equalsIgnoreCase(destination) || (d.getTrip() != null && d.getTrip().getDestination() != null && d.getTrip().getDestination().equalsIgnoreCase(destination)))
                .toList();

        List<Notification> filteredNotifications = allNotifications.stream()
                .filter(n -> finalRangeStart == null || (n.getCreatedAt() != null && n.getCreatedAt().isAfter(finalRangeStart)))
                .toList();

        // 1. User metrics
        long totalUsers = filteredUsers.size();
        long activeUsers = filteredMembers.stream()
                .map(tm -> tm.getUser().getId())
                .distinct()
                .count();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newUsers = filteredUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long newUsersLast7Days = filteredUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(sevenDaysAgo))
                .count();

        long usersInTrips = activeUsers;
        long totalTripMemberships = filteredMembers.size();

        // 2. Trip metrics
        long totalTrips = filteredTrips.size();
        long upcomingTrips = 0;
        long ongoingTrips = 0;
        long completedTrips = 0;
        long groupTrips = 0;

        for (Trip trip : filteredTrips) {
            LocalDate start = trip.getStartDate();
            LocalDate end = trip.getEndDate();

            if (start != null && start.isAfter(today)) {
                upcomingTrips++;
            } else if (start != null && end != null && !start.isAfter(today) && !end.isBefore(today)) {
                ongoingTrips++;
            } else if (end != null && end.isBefore(today)) {
                completedTrips++;
            }

            long members = allMembers.stream().filter(tm -> tm.getTrip() != null && tm.getTrip().getId() != null && tm.getTrip().getId().equals(trip.getId())).count();
            if (members > 1) {
                groupTrips++;
            }
        }

        double averageMembersPerTrip = totalTrips > 0 ? (double) totalTripMemberships / totalTrips : 0.0;

        long usersWhoCreatedTrips = filteredTrips.stream()
                .map(t -> t.getUser().getId())
                .distinct()
                .count();

        // 3. Destination metrics
        Set<String> distinctDestinations = filteredTrips.stream()
                .map(Trip::getDestination)
                .filter(d -> d != null && !d.trim().isEmpty())
                .collect(Collectors.toSet());
        long totalDestinations = distinctDestinations.size();

        Map<String, Long> destCountMap = new HashMap<>();
        for (Trip t : filteredTrips) {
            String dest = t.getDestination();
            if (dest != null && !dest.trim().isEmpty()) {
                destCountMap.put(dest, destCountMap.getOrDefault(dest, 0L) + 1);
            }
        }

        List<AdminAnalyticsResponse.PopularDestinationDto> popularDestinations = destCountMap.entrySet().stream()
                .map(entry -> AdminAnalyticsResponse.PopularDestinationDto.builder()
                        .destination(entry.getKey())
                        .tripCount(entry.getValue())
                        .build())
                .sorted((d1, d2) -> Long.compare(d2.getTripCount(), d1.getTripCount()))
                .limit(5)
                .toList();

        // 4. Platform statistics
        long totalActivities = filteredActivities.size();
        long totalExpenses = filteredExpenses.size();
        long totalDocuments = filteredDocuments.size();
        long totalNotifications = filteredNotifications.size();

        // Trends & Breakdowns calculations
        Map<String, Long> userRegistrationTrend = new HashMap<>();
        for (User u : filteredUsers) {
            if (u.getCreatedAt() != null) {
                String dateStr = u.getCreatedAt().toLocalDate().toString();
                userRegistrationTrend.put(dateStr, userRegistrationTrend.getOrDefault(dateStr, 0L) + 1);
            }
        }

        Map<String, Double> expensesByMonth = new HashMap<>();
        for (Expense e : filteredExpenses) {
            if (e.getAmount() != null) {
                LocalDateTime expenseTime = e.getCreatedAt();
                String monthStr;
                if (expenseTime != null) {
                    monthStr = expenseTime.toLocalDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
                } else if (e.getTrip() != null && e.getTrip().getStartDate() != null) {
                    monthStr = e.getTrip().getStartDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
                } else {
                    continue;
                }
                expensesByMonth.put(monthStr, expensesByMonth.getOrDefault(monthStr, 0.0) + e.getAmount());
            }
        }

        Map<String, Long> activitiesByMonth = new HashMap<>();
        for (Activity a : filteredActivities) {
            LocalDateTime activityTime = a.getCreatedAt();
            String monthStr;
            if (activityTime != null) {
                monthStr = activityTime.toLocalDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
            } else if (a.getItinerary() != null && a.getItinerary().getTrip() != null && a.getItinerary().getTrip().getStartDate() != null) {
                monthStr = a.getItinerary().getTrip().getStartDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
            } else {
                continue;
            }
            activitiesByMonth.put(monthStr, activitiesByMonth.getOrDefault(monthStr, 0L) + 1);
        }

        Map<String, Long> activitiesByType = new HashMap<>();
        for (Activity a : filteredActivities) {
            if (a.getActivityType() != null) {
                String typeStr = a.getActivityType().name();
                activitiesByType.put(typeStr, activitiesByType.getOrDefault(typeStr, 0L) + 1);
            }
        }

        Map<String, Long> documentsByType = new HashMap<>();
        for (Document d : filteredDocuments) {
            if (d.getDocumentType() != null) {
                String typeStr = d.getDocumentType().toLowerCase();
                String simpleType = "Other";
                if (typeStr.contains("pdf")) {
                    simpleType = "PDF";
                } else if (typeStr.contains("image") || typeStr.contains("png") || typeStr.contains("jpg") || typeStr.contains("jpeg") || typeStr.contains("webp")) {
                    simpleType = "Image";
                }
                documentsByType.put(simpleType, documentsByType.getOrDefault(simpleType, 0L) + 1);
            }
        }

        Map<String, Long> notificationsByType = new HashMap<>();
        for (Notification n : filteredNotifications) {
            if (n.getType() != null) {
                notificationsByType.put(n.getType(), notificationsByType.getOrDefault(n.getType(), 0L) + 1);
            }
        }

        return AdminAnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .newUsers(newUsers)
                .usersInTrips(usersInTrips)
                .groupMembersCount(totalTripMemberships)
                .totalTrips(totalTrips)
                .upcomingTrips(upcomingTrips)
                .ongoingTrips(ongoingTrips)
                .completedTrips(completedTrips)
                .groupTrips(groupTrips)
                .averageMembersPerTrip(averageMembersPerTrip)
                .totalDestinations(totalDestinations)
                .popularDestinations(popularDestinations)
                .totalActivities(totalActivities)
                .totalExpenses(totalExpenses)
                .totalDocuments(totalDocuments)
                .totalNotifications(totalNotifications)
                .revenueReportStatus("NO_REVENUE_DATA")
                .platformRevenue(0.0)
                .newUsersLast7Days(newUsersLast7Days)
                .usersWhoCreatedTrips(usersWhoCreatedTrips)
                .uniqueUsersInTrips(usersInTrips)
                .totalTripMemberships(totalTripMemberships)
                .userRegistrationTrend(userRegistrationTrend)
                .expensesByMonth(expensesByMonth)
                .activitiesByMonth(activitiesByMonth)
                .activitiesByType(activitiesByType)
                .documentsByType(documentsByType)
                .notificationsByType(notificationsByType)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminUserListResponse.AdminUserListItem> getAdminUsers() {
        List<User> users = userRepository.findAll();
        List<Trip> trips = tripRepository.findAll();
        List<TripMember> members = tripMemberRepository.findAll();

        List<AdminUserListResponse.AdminUserListItem> listItems = new ArrayList<>();
        for (User u : users) {
            String roleName = u.getRoles().stream()
                    .map(r -> r.getName().name().replace("ROLE_", ""))
                    .findFirst()
                    .orElse("USER");

            long tripsCreatedCount = trips.stream()
                    .filter(t -> t.getUser().getId().equals(u.getId()))
                    .count();

            long tripsJoinedCount = members.stream()
                    .filter(tm -> tm.getUser().getId().equals(u.getId()))
                    .count();

            listItems.add(AdminUserListResponse.AdminUserListItem.builder()
                    .id(u.getId())
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .role(roleName)
                    .tripsCreatedCount(tripsCreatedCount)
                    .tripsJoinedCount(tripsJoinedCount)
                    .status("ACTIVE")
                    .createdAt(u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now())
                    .build());
        }
        return listItems;
    }

    @Transactional(readOnly = true)
    public AdminUserListResponse.AdminUserDetails getAdminUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Trip> allTrips = tripRepository.findAll();
        List<TripMember> allMembers = tripMemberRepository.findAll();
        List<Activity> allActivities = activityRepository.findAll();
        List<Expense> allExpenses = expenseRepository.findAll();

        String roleName = user.getRoles().stream()
                .map(r -> r.getName().name().replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");

        long tripsCreatedCount = allTrips.stream()
                .filter(t -> t.getUser() != null && t.getUser().getId() != null && t.getUser().getId().equals(user.getId()))
                .count();

        long tripsJoinedCount = allMembers.stream()
                .filter(tm -> tm.getUser() != null && tm.getUser().getId() != null && tm.getUser().getId().equals(user.getId()))
                .count();

        // Get trips user is creator or member of
        List<AdminUserListResponse.AdminUserTripItem> userTrips = new ArrayList<>();
        
        List<Trip> joinedTrips = allMembers.stream()
                .filter(tm -> tm.getUser() != null && tm.getUser().getId() != null && tm.getUser().getId().equals(user.getId()) && tm.getTrip() != null)
                .map(TripMember::getTrip)
                .distinct()
                .toList();

        for (Trip trip : joinedTrips) {
            boolean isCreator = trip.getUser() != null && trip.getUser().getId() != null && trip.getUser().getId().equals(user.getId());
            userTrips.add(AdminUserListResponse.AdminUserTripItem.builder()
                    .id(trip.getId())
                    .title(trip.getTitle())
                    .destination(trip.getDestination())
                    .startDate(trip.getStartDate())
                    .endDate(trip.getEndDate())
                    .status(trip.getStatus() != null ? trip.getStatus().name() : "PLANNING")
                    .role(isCreator ? "Creator" : "Member")
                    .build());
        }

        // Count activities created by this user
        long activitiesCount = allActivities.stream()
                .filter(a -> a.getCreatedBy() != null && a.getCreatedBy().getId().equals(user.getId()))
                .count();

        // Count expenses paid by this user
        long expensesCount = allExpenses.stream()
                .filter(e -> e.getPaidBy() != null && e.getPaidBy().getId().equals(user.getId()))
                .count();

        return AdminUserListResponse.AdminUserDetails.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleName)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.now())
                .status("ACTIVE")
                .tripsCreatedCount(tripsCreatedCount)
                .tripsJoinedCount(tripsJoinedCount)
                .activitiesCount(activitiesCount)
                .expensesCount(expensesCount)
                .trips(userTrips)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminTripListResponse.AdminTripListItem> getAdminTrips() {
        List<Trip> trips = tripRepository.findAll();
        List<TripMember> members = tripMemberRepository.findAll();

        List<AdminTripListResponse.AdminTripListItem> listItems = new ArrayList<>();
        for (Trip trip : trips) {
            long membersCount = members.stream()
                    .filter(tm -> tm.getTrip().getId().equals(trip.getId()))
                    .count();

            listItems.add(AdminTripListResponse.AdminTripListItem.builder()
                    .id(trip.getId())
                    .title(trip.getTitle())
                    .creatorName(trip.getUser().getFullName())
                    .creatorEmail(trip.getUser().getEmail())
                    .destination(trip.getDestination())
                    .membersCount(membersCount)
                    .status(trip.getStatus() != null ? trip.getStatus().name() : "PLANNING")
                    .startDate(trip.getStartDate())
                    .endDate(trip.getEndDate())
                    .budget(trip.getBudget())
                    .createdAt(trip.getCreatedAt() != null ? trip.getCreatedAt() : LocalDateTime.now())
                    .build());
        }
        return listItems;
    }

    @Transactional(readOnly = true)
    public AdminTripListResponse.AdminTripDetails getAdminTripDetails(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        List<TripMember> members = tripMemberRepository.findByTripId(trip.getId());
        List<Expense> expenses = expenseRepository.findByTripId(trip.getId());
        
        // Count activities for this trip
        List<Activity> activities = activityRepository.findByItineraryTripIn(List.of(trip));
        long activitiesCount = activities.size();

        // Count documents for this trip
        long documentsCount = documentRepository.findAll().stream()
                .filter(d -> d.getTrip().getId().equals(trip.getId()))
                .count();

        double currentExpenses = expenses.stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();

        // Map members
        List<AdminTripListResponse.AdminTripMemberItem> memberItems = new ArrayList<>();
        String groupAdminName = "None";
        for (TripMember tm : members) {
            String tmRole = tm.getTripRole() != null ? tm.getTripRole().name() : "MEMBER";
            if ("GROUP_ADMIN".equals(tmRole)) {
                groupAdminName = tm.getUser().getFullName();
            }
            memberItems.add(AdminTripListResponse.AdminTripMemberItem.builder()
                    .name(tm.getUser().getFullName())
                    .email(tm.getUser().getEmail())
                    .tripRole(tmRole)
                    .joinedAt(tm.getJoinedAt() != null ? tm.getJoinedAt() : LocalDateTime.now())
                    .build());
        }

        // If creator is not GROUP_ADMIN, and group admin is still None, fallback to creator
        if ("None".equals(groupAdminName) && trip.getUser() != null) {
            groupAdminName = trip.getUser().getFullName();
        }

        return AdminTripListResponse.AdminTripDetails.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .creatorName(trip.getUser() != null ? trip.getUser().getFullName() : "Unknown")
                .creatorEmail(trip.getUser() != null ? trip.getUser().getEmail() : "")
                .groupAdminName(groupAdminName)
                .destination(trip.getDestination())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .budget(trip.getBudget())
                .currentExpenses(currentExpenses)
                .membersCount(members.size())
                .activitiesCount(activitiesCount)
                .documentsCount(documentsCount)
                .members(memberItems)
                .build();
    }
}
