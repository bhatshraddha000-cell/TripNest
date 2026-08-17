package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.dto.AdminAnalyticsResponse;
import com.tripnest.tripnest.dto.AnalyticsResponse;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Document;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.ExpenseSplit;
import com.tripnest.tripnest.model.Notification;
import com.tripnest.tripnest.model.PaymentStatus;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.DocumentRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.NotificationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.AnalyticsService;

public class AnalyticsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User user;
    private User arun;
    private Trip upcomingTrip;
    private Trip completedTrip;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        user = User.builder().id(101L).fullName("Hari").email("hari@tripnest.com").build();
        arun = User.builder().id(102L).fullName("Arun").email("arun@tripnest.com").build();

        LocalDate today = LocalDate.now();
        upcomingTrip = Trip.builder()
                .id(1L)
                .title("Goa Trip")
                .destination("Goa")
                .startDate(today.plusDays(5))
                .endDate(today.plusDays(10))
                .budget(50000.0)
                .user(user)
                .build();

        completedTrip = Trip.builder()
                .id(2L)
                .title("Tokyo Trip")
                .destination("Tokyo")
                .startDate(today.minusDays(15))
                .endDate(today.minusDays(10))
                .budget(100000.0)
                .user(user)
                .build();

        // Setup Security context
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("hari@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("hari@tripnest.com")).thenReturn(Optional.of(user));
    }

    @Test
    public void testGetTravelerAnalytics_Success() {
        TripMember member1 = TripMember.builder().trip(upcomingTrip).user(user).tripRole(TripMemberRole.GROUP_ADMIN).build();
        TripMember member2 = TripMember.builder().trip(completedTrip).user(user).tripRole(TripMemberRole.GROUP_ADMIN).build();

        when(tripMemberRepository.findByUser(user)).thenReturn(List.of(member1, member2));

        Expense exp1 = Expense.builder().id(1L).trip(upcomingTrip).amount(10000.0).category("Hotel").paidBy(user).build();
        Expense exp2 = Expense.builder().id(2L).trip(upcomingTrip).amount(5000.0).category("Food").paidBy(user).build();
        List<Expense> expenses = List.of(exp1, exp2);

        when(expenseRepository.findByTripIn(anyList())).thenAnswer(invocation -> expenses);

        ExpenseSplit split1 = ExpenseSplit.builder()
                .expense(exp1)
                .user(user)
                .shareAmount(5000.0)
                .paymentStatus(PaymentStatus.PAID)
                .build();
        ExpenseSplit split2 = ExpenseSplit.builder()
                .expense(exp2)
                .user(user)
                .shareAmount(2500.0)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        when(expenseSplitRepository.findByUserId(user.getId())).thenReturn(List.of(split1, split2));

        Activity activity = Activity.builder().id(1L).estimatedCost(3000.0).build();
        when(activityRepository.findByItineraryTripIn(anyList())).thenReturn(List.of(activity));

        AnalyticsResponse response = analyticsService.getTravelerAnalytics();

        assertNotNull(response);
        assertEquals(2, response.getTotalTrips());
        assertEquals(1, response.getUpcomingTrips());
        assertEquals(1, response.getCompletedTrips());
        assertEquals(150000.0, response.getTotalBudget());
        assertEquals(15000.0, response.getTotalSpent());
        assertEquals(135000.0, response.getRemainingBudget());
        assertEquals(10.0, response.getBudgetUtilization()); // 15000 / 150000 * 100
        assertEquals(3000.0, response.getTotalEstimatedCost());
        assertEquals(1, response.getTotalActivities());
        assertEquals(2, response.getTotalDestinations());

        // Category breakdown verification
        assertEquals(10000.0, response.getExpenseByCategory().get("Hotel"));
        assertEquals(5000.0, response.getExpenseByCategory().get("Food"));

        // User share verification
        assertEquals(15000.0, response.getAmountPaidByCurrentUser());
        assertEquals(5000.0, response.getSettledAmount());
        assertEquals(2500.0, response.getPendingAmount());
    }

    @Test
    public void testGetAdminAnalytics_Success() {
        when(userRepository.findAll()).thenReturn(Collections.nCopies(10, user));
        
        TripMember tm1 = TripMember.builder().user(user).trip(upcomingTrip).build();
        TripMember tm2 = TripMember.builder().user(arun).trip(upcomingTrip).build();
        when(tripMemberRepository.findAll()).thenReturn(List.of(tm1, tm2));

        when(tripRepository.findAll()).thenReturn(List.of(upcomingTrip, completedTrip));
        when(activityRepository.findAll()).thenReturn(Collections.nCopies(15, Activity.builder().build()));
        when(expenseRepository.findAll()).thenReturn(Collections.nCopies(8, Expense.builder().build()));
        when(documentRepository.findAll()).thenReturn(Collections.nCopies(4, Document.builder().build()));
        when(notificationRepository.findAll()).thenReturn(Collections.nCopies(20, Notification.builder().build()));

        AdminAnalyticsResponse response = analyticsService.getAdminAnalytics();

        assertNotNull(response);
        assertEquals(10, response.getTotalUsers());
        assertEquals(2, response.getActiveUsers()); // Unique users from trip members
        assertEquals(2, response.getTotalTrips());
        assertEquals(15, response.getTotalActivities());
        assertEquals(8, response.getTotalExpenses());
        assertEquals(4, response.getTotalDocuments());
        assertEquals(20, response.getTotalNotifications());
    }

    @Test
    public void testGetTravelerAnalytics_SpecificTrip_Success() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(upcomingTrip));

        Expense exp = Expense.builder().id(1L).trip(upcomingTrip).amount(10000.0).category("Hotel").paidBy(user).build();
        when(expenseRepository.findByTripId(1L)).thenReturn(List.of(exp));

        ExpenseSplit split = ExpenseSplit.builder()
                .expense(exp)
                .user(user)
                .shareAmount(5000.0)
                .paymentStatus(PaymentStatus.PAID)
                .build();
        when(expenseSplitRepository.findByUserId(user.getId())).thenReturn(List.of(split));

        Activity activity = Activity.builder().id(1L).estimatedCost(3000.0).build();
        when(activityRepository.findByItineraryTripIn(anyList())).thenReturn(List.of(activity));

        AnalyticsResponse response = analyticsService.getTravelerAnalytics(1L);

        assertNotNull(response);
        assertEquals(1, response.getTotalTrips());
        assertEquals(1, response.getUpcomingTrips());
        assertEquals(50000.0, response.getTotalBudget());
        assertEquals(10000.0, response.getTotalSpent());
        assertEquals(40000.0, response.getRemainingBudget());
        assertEquals(20.0, response.getBudgetUtilization());
        assertEquals(1, response.getTotalActivities());
        assertEquals(1, response.getTotalDestinations());
        assertEquals("Goa", response.getFavoriteDestinations().get(0).getDestination());
    }

    @Test
    public void testGetTravelerAnalytics_SpecificTrip_Unauthorized() {
        Trip otherTrip = Trip.builder()
                .id(3L)
                .title("Secret Trip")
                .user(arun)
                .build();
        when(tripRepository.findById(3L)).thenReturn(Optional.of(otherTrip));
        when(tripMemberRepository.existsByTripIdAndUserId(3L, user.getId())).thenReturn(false);

        org.junit.jupiter.api.Assertions.assertThrows(SecurityException.class, () -> {
            analyticsService.getTravelerAnalytics(3L);
        });
    }

    @Test
    public void testGetTravelerAnalytics_SpecificTrip_NotFound() {
        when(tripRepository.findById(99L)).thenReturn(Optional.empty());

        org.junit.jupiter.api.Assertions.assertThrows(com.tripnest.tripnest.exception.TripNotFoundException.class, () -> {
            analyticsService.getTravelerAnalytics(99L);
        });
    }
}
