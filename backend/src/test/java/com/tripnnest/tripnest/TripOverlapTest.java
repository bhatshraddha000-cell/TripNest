package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.dto.CreateTripRequest;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.dto.UpdateTripRequest;
import com.tripnest.tripnest.exception.TripOverlapException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;
import com.tripnest.tripnest.repository.DocumentRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.TripInvitationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.ActivityLogService;
import com.tripnest.tripnest.service.TripService;

public class TripOverlapTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private TripInvitationRepository tripInvitationRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private TripService tripService;

    private User user;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        user = User.builder().id(1L).fullName("Test User").email("user@tripnest.com").build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("user@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@tripnest.com")).thenReturn(Optional.of(user));
    }

    @Test
    public void testCreateTrip_NonOverlapping_Success() {
        LocalDate start = LocalDate.of(2026, 8, 20);
        LocalDate end = LocalDate.of(2026, 8, 25);

        when(tripRepository.existsOverlappingTripForUser(user, start, end)).thenReturn(false);
        when(tripRepository.save(any(Trip.class))).thenAnswer(invocation -> {
            Trip t = invocation.getArgument(0);
            t.setId(100L);
            return t;
        });

        CreateTripRequest request = CreateTripRequest.builder()
                .title("Goa Trip")
                .destination("Goa")
                .startDate(start)
                .endDate(end)
                .travelers(2)
                .budget(20000.0)
                .build();

        TripResponse response = tripService.createTrip(request);

        assertNotNull(response);
        assertEquals("Goa Trip", response.getTitle());
    }

    @Test
    public void testCreateTrip_Overlapping_ThrowsException() {
        LocalDate start = LocalDate.of(2026, 8, 20);
        LocalDate end = LocalDate.of(2026, 8, 25);

        when(tripRepository.existsOverlappingTripForUser(user, start, end)).thenReturn(true);

        CreateTripRequest request = CreateTripRequest.builder()
                .title("Overlapping Trip")
                .destination("Karnataka")
                .startDate(start)
                .endDate(end)
                .travelers(2)
                .budget(15000.0)
                .build();

        TripOverlapException ex = assertThrows(TripOverlapException.class, () -> {
            tripService.createTrip(request);
        });

        assertEquals("Trip dates overlap with an existing trip. Please choose a different date range.", ex.getMessage());
    }

    @Test
    public void testUpdateTrip_Overlapping_ThrowsException() {
        Trip existingTrip = Trip.builder()
                .id(10L)
                .title("Karnataka Tour")
                .destination("Karnataka")
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 5))
                .status(TripStatus.PLANNING)
                .user(user)
                .build();

        TripMember member = TripMember.builder()
                .trip(existingTrip)
                .user(user)
                .tripRole(TripMemberRole.GROUP_ADMIN)
                .build();

        when(tripMemberRepository.findByTripIdAndUserId(10L, user.getId())).thenReturn(Optional.of(member));

        LocalDate newStart = LocalDate.of(2026, 8, 20);
        LocalDate newEnd = LocalDate.of(2026, 8, 25);

        when(tripRepository.existsOverlappingTripForUserExcludingTrip(user, 10L, newStart, newEnd)).thenReturn(true);

        UpdateTripRequest request = UpdateTripRequest.builder()
                .title("Updated Trip")
                .destination("Karnataka")
                .startDate(newStart)
                .endDate(newEnd)
                .travelers(2)
                .budget(20000.0)
                .status(TripStatus.PLANNING)
                .build();

        TripOverlapException ex = assertThrows(TripOverlapException.class, () -> {
            tripService.updateTrip(10L, request);
        });

        assertEquals("Trip dates overlap with an existing trip. Please choose a different date range.", ex.getMessage());
    }
}
