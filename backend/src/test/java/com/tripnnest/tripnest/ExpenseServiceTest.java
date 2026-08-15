package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
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

import com.tripnest.tripnest.dto.CreateExpenseRequest;
import com.tripnest.tripnest.dto.ExpenseResponse;
import com.tripnest.tripnest.dto.ExpenseSplitResponse;
import com.tripnest.tripnest.dto.ParticipantSplitRequest;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Expense;
import com.tripnest.tripnest.model.ExpenseSplit;
import com.tripnest.tripnest.model.PaymentStatus;
import com.tripnest.tripnest.model.SplitType;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.ActivityLogService;
import com.tripnest.tripnest.service.ExpenseService;
import com.tripnest.tripnest.service.NotificationService;

public class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ItineraryRepository itineraryRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private ExpenseService expenseService;

    private User hari;
    private User arun;
    private User karthik;
    private User praveen;
    private Trip trip;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        hari = User.builder().id(101L).fullName("Hari").email("hari@tripnest.com").build();
        arun = User.builder().id(102L).fullName("Arun").email("arun@tripnest.com").build();
        karthik = User.builder().id(103L).fullName("Karthik").email("karthik@tripnest.com").build();
        praveen = User.builder().id(104L).fullName("Praveen").email("praveen@tripnest.com").build();

        trip = Trip.builder().id(1L).title("Goa Trip").user(hari).build();

        // Setup Security Context
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("hari@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("hari@tripnest.com")).thenReturn(Optional.of(hari));
        when(userRepository.findById(101L)).thenReturn(Optional.of(hari));
        when(userRepository.findById(102L)).thenReturn(Optional.of(arun));
        when(userRepository.findById(103L)).thenReturn(Optional.of(karthik));
        when(userRepository.findById(104L)).thenReturn(Optional.of(praveen));

        when(tripRepository.findById(1L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.existsByTripIdAndUserId(1L, 101L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(1L, 102L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(1L, 103L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(1L, 104L)).thenReturn(true);

        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense e = invocation.getArgument(0);
            e.setId(10L);
            return e;
        });
    }

    @Test
    public void testEqualSplit_Success() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .title("Lunch")
                .amount(2000.0)
                .category("Food")
                .paidById(101L)
                .splitType(SplitType.EQUAL)
                .participantIds(List.of(101L, 102L, 103L, 104L))
                .date(LocalDate.now())
                .build();

        ExpenseResponse response = expenseService.addExpense(1L, request);

        assertNotNull(response);
        assertEquals("Lunch", response.getTitle());
        assertEquals(2000.0, response.getAmount());
        assertEquals(4, response.getParticipants().size());

        for (ExpenseSplitResponse split : response.getParticipants()) {
            assertEquals(500.0, split.getShareAmount());
            if (split.getUserId().equals(101L)) {
                assertEquals(PaymentStatus.PAID, split.getPaymentStatus());
            } else {
                assertEquals(PaymentStatus.PENDING, split.getPaymentStatus());
            }
        }
    }

    @Test
    public void testEqualSplit_RoundingRemainder() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .title("Taxi")
                .amount(100.0)
                .category("Transportation")
                .paidById(101L)
                .splitType(SplitType.EQUAL)
                .participantIds(List.of(101L, 102L, 103L))
                .date(LocalDate.now())
                .build();

        ExpenseResponse response = expenseService.addExpense(1L, request);

        List<ExpenseSplitResponse> participants = response.getParticipants();
        assertEquals(3, participants.size());

        double sumShares = 0.0;
        for (ExpenseSplitResponse split : participants) {
            sumShares += split.getShareAmount();
        }

        assertEquals(100.0, sumShares, 0.001);
        assertEquals(33.34, participants.get(0).getShareAmount());
        assertEquals(33.33, participants.get(1).getShareAmount());
        assertEquals(33.33, participants.get(2).getShareAmount());
    }

    @Test
    public void testCustomSplit_Success() {
        List<ParticipantSplitRequest> customSplits = List.of(
                ParticipantSplitRequest.builder().userId(101L).amount(800.0).build(),
                ParticipantSplitRequest.builder().userId(102L).amount(400.0).build(),
                ParticipantSplitRequest.builder().userId(103L).amount(400.0).build(),
                ParticipantSplitRequest.builder().userId(104L).amount(400.0).build()
        );

        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .title("Dinner")
                .amount(2000.0)
                .category("Food")
                .paidById(101L)
                .splitType(SplitType.CUSTOM)
                .customSplits(customSplits)
                .date(LocalDate.now())
                .build();

        ExpenseResponse response = expenseService.addExpense(1L, request);

        assertEquals(4, response.getParticipants().size());
        assertEquals(800.0, response.getParticipants().stream().filter(p -> p.getUserId().equals(101L)).findFirst().get().getShareAmount());
        assertEquals(400.0, response.getParticipants().stream().filter(p -> p.getUserId().equals(102L)).findFirst().get().getShareAmount());
    }

    @Test
    public void testCustomSplit_InvalidTotal_ThrowsException() {
        List<ParticipantSplitRequest> customSplits = List.of(
                ParticipantSplitRequest.builder().userId(101L).amount(800.0).build(),
                ParticipantSplitRequest.builder().userId(102L).amount(400.0).build(),
                ParticipantSplitRequest.builder().userId(103L).amount(300.0).build(),
                ParticipantSplitRequest.builder().userId(104L).amount(400.0).build()
        ); // Total 1900 != 2000

        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .title("Dinner")
                .amount(2000.0)
                .category("Food")
                .paidById(101L)
                .splitType(SplitType.CUSTOM)
                .customSplits(customSplits)
                .date(LocalDate.now())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            expenseService.addExpense(1L, request);
        });

        assertTrue(ex.getMessage().contains("must equal the total expense amount"));
    }

    @Test
    public void testUnauthorizedParticipant_ThrowsException() {
        when(tripMemberRepository.existsByTripIdAndUserId(1L, 999L)).thenReturn(false);
        when(userRepository.findById(999L)).thenReturn(Optional.of(User.builder().id(999L).fullName("Stranger").build()));

        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .title("Lunch")
                .amount(2000.0)
                .category("Food")
                .paidById(101L)
                .splitType(SplitType.EQUAL)
                .participantIds(List.of(101L, 999L))
                .date(LocalDate.now())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            expenseService.addExpense(1L, request);
        });

        assertTrue(ex.getMessage().contains("must belong to the trip"));
    }

    @Test
    public void testMarkExpenseSplitPaid_Success() {
        Expense expense = Expense.builder()
                .id(10L)
                .trip(trip)
                .paidBy(hari)
                .title("Lunch")
                .amount(2000.0)
                .build();

        ExpenseSplit split = ExpenseSplit.builder()
                .id(50L)
                .expense(expense)
                .user(arun)
                .shareAmount(500.0)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        when(expenseSplitRepository.findById(50L)).thenReturn(Optional.of(split));
        when(expenseSplitRepository.save(any(ExpenseSplit.class))).thenAnswer(i -> i.getArgument(0));

        ExpenseSplitResponse response = expenseService.markExpenseSplitPaid(50L);

        assertEquals(PaymentStatus.PAID, response.getPaymentStatus());
        assertNotNull(response.getPaidAt());
    }
}
