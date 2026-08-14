package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
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

import com.tripnest.tripnest.dto.DashboardResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.NotificationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.ActivityLogService;
import com.tripnest.tripnest.service.DashboardService;

public class DashboardServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private DashboardService dashboardService;

    private User testUser;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        testUser = User.builder().id(1L).fullName("Test User").email("user@tripnest.com").build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("user@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@tripnest.com")).thenReturn(Optional.of(testUser));
        when(tripRepository.findByUser(testUser)).thenReturn(List.of());
        when(notificationRepository.findTop5ByReceiverOrderByCreatedAtDesc(testUser)).thenReturn(List.of());
        when(activityLogService.getDashboardActivities(testUser)).thenReturn(List.of());
    }

    @Test
    public void testGetDashboardData_CurrentTripActive() {
        LocalDate today = LocalDate.now();

        Trip tripKarnataka = Trip.builder()
                .id(10L)
                .title("Karnataka Tour")
                .destination("Karnataka")
                .startDate(today.minusDays(2))
                .endDate(today.plusDays(3))
                .budget(20000.0)
                .status(TripStatus.PLANNED)
                .user(testUser)
                .build();

        Trip tripGoa = Trip.builder()
                .id(11L)
                .title("Goa Trip")
                .destination("Goa")
                .startDate(today.plusDays(10))
                .endDate(today.plusDays(15))
                .budget(50000.0)
                .status(TripStatus.PLANNING)
                .user(testUser)
                .build();

        TripMember tm1 = TripMember.builder().id(1L).trip(tripKarnataka).user(testUser).tripRole(TripMemberRole.GROUP_ADMIN).build();
        TripMember tm2 = TripMember.builder().id(2L).trip(tripGoa).user(testUser).tripRole(TripMemberRole.GROUP_ADMIN).build();

        when(tripMemberRepository.findByUser(testUser)).thenReturn(List.of(tm1, tm2));

        Expense exp1 = Expense.builder().id(100L).trip(tripKarnataka).amount(5000.0).build();
        Expense exp2 = Expense.builder().id(101L).trip(tripGoa).amount(12000.0).build();

        when(expenseRepository.findByTripIn(any())).thenReturn(List.of(exp1, exp2));

        DashboardResponse response = dashboardService.getDashboardData();

        assertNotNull(response);
        assertNotNull(response.getBudgetSummary());
        assertEquals("CURRENT_TRIP", response.getBudgetSummary().getMode());
        assertEquals(10L, response.getBudgetSummary().getTripId());
        assertEquals("Karnataka", response.getBudgetSummary().getDestination());
        assertEquals(20000.0, response.getBudgetSummary().getTotalBudget());
        assertEquals(5000.0, response.getBudgetSummary().getSpent());
        assertEquals(15000.0, response.getBudgetSummary().getRemaining());
        assertEquals(25.0, response.getBudgetSummary().getSpentPercentage());
    }

    @Test
    public void testGetDashboardData_NoCurrentTrip_FallbackToAllTrips() {
        LocalDate today = LocalDate.now();

        Trip tripPast = Trip.builder()
                .id(10L)
                .title("Past Trip")
                .destination("Kerala")
                .startDate(today.minusDays(10))
                .endDate(today.minusDays(5))
                .budget(50000.0)
                .status(TripStatus.COMPLETED)
                .user(testUser)
                .build();

        Trip tripFuture = Trip.builder()
                .id(11L)
                .title("Future Trip")
                .destination("Manali")
                .startDate(today.plusDays(10))
                .endDate(today.plusDays(15))
                .budget(90000.0)
                .status(TripStatus.PLANNING)
                .user(testUser)
                .build();

        TripMember tm1 = TripMember.builder().id(1L).trip(tripPast).user(testUser).tripRole(TripMemberRole.GROUP_ADMIN).build();
        TripMember tm2 = TripMember.builder().id(2L).trip(tripFuture).user(testUser).tripRole(TripMemberRole.GROUP_ADMIN).build();

        when(tripMemberRepository.findByUser(testUser)).thenReturn(List.of(tm1, tm2));

        Expense exp1 = Expense.builder().id(100L).trip(tripPast).amount(5000.0).build();
        Expense exp2 = Expense.builder().id(101L).trip(tripFuture).amount(8200.0).build();

        when(expenseRepository.findByTripIn(any())).thenReturn(List.of(exp1, exp2));

        DashboardResponse response = dashboardService.getDashboardData();

        assertNotNull(response);
        assertNotNull(response.getBudgetSummary());
        assertEquals("ALL_TRIPS", response.getBudgetSummary().getMode());
        assertNull(response.getBudgetSummary().getDestination());
        assertEquals(140000.0, response.getBudgetSummary().getTotalBudget());
        assertEquals(13200.0, response.getBudgetSummary().getSpent());
        assertEquals(126800.0, response.getBudgetSummary().getRemaining());
        assertEquals(13200.0 / 140000.0 * 100.0, response.getBudgetSummary().getSpentPercentage(), 0.001);
    }
}
