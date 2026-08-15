package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.dto.ActivityResponse;
import com.tripnest.tripnest.dto.CreateActivityRequest;
import com.tripnest.tripnest.dto.UpdateActivityRequest;
import com.tripnest.tripnest.exception.ActivityOverlapException;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.ActivityType;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.ActivityLogService;
import com.tripnest.tripnest.service.ActivityService;

public class ActivityOverlapTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ItineraryRepository itineraryRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private ActivityService activityService;

    private User user;
    private Trip trip;
    private Itinerary itinerary;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        user = User.builder().id(1L).fullName("Test User").email("user@tripnest.com").build();
        trip = Trip.builder().id(10L).title("Test Trip").user(user).build();
        itinerary = Itinerary.builder().id(100L).trip(trip).dayNumber(1).build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("user@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@tripnest.com")).thenReturn(Optional.of(user));
        when(itineraryRepository.findByIdAndTripId(100L, 10L)).thenReturn(Optional.of(itinerary));

        TripMember member = TripMember.builder().trip(trip).user(user).tripRole(TripMemberRole.GROUP_ADMIN).build();
        when(tripMemberRepository.findByTripIdAndUserId(10L, 1L)).thenReturn(Optional.of(member));
    }

    @Test
    public void testCreateActivity_BackToBack_Success() {
        LocalTime start = LocalTime.of(12, 0);
        LocalTime end = LocalTime.of(14, 0);

        when(activityRepository.existsOverlappingActivityForItinerary(100L, start, end)).thenReturn(false);
        when(activityRepository.save(any(Activity.class))).thenAnswer(i -> {
            Activity a = i.getArgument(0);
            a.setId(500L);
            return a;
        });

        CreateActivityRequest request = CreateActivityRequest.builder()
                .title("Lunch")
                .activityType(ActivityType.DINING)
                .location("Restaurant")
                .startTime(start)
                .endTime(end)
                .estimatedCost(500.0)
                .build();

        ActivityResponse response = activityService.createActivity(10L, 100L, request);

        assertNotNull(response);
        assertEquals("Lunch", response.getTitle());
    }

    @Test
    public void testCreateActivity_Overlapping_ThrowsException() {
        LocalTime start = LocalTime.of(11, 0);
        LocalTime end = LocalTime.of(13, 0);

        when(activityRepository.existsOverlappingActivityForItinerary(100L, start, end)).thenReturn(true);

        CreateActivityRequest request = CreateActivityRequest.builder()
                .title("Overlapping Activity")
                .activityType(ActivityType.SIGHTSEEING)
                .location("Museum")
                .startTime(start)
                .endTime(end)
                .estimatedCost(200.0)
                .build();

        ActivityOverlapException ex = assertThrows(ActivityOverlapException.class, () -> {
            activityService.createActivity(10L, 100L, request);
        });

        assertEquals("This activity overlaps with an existing activity on this itinerary day. Please choose a different time range.", ex.getMessage());
    }

    @Test
    public void testUpdateActivity_Overlapping_ThrowsException() {
        Activity existingActivity = Activity.builder()
                .id(500L)
                .itinerary(itinerary)
                .title("Current Activity")
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .createdBy(user)
                .build();

        when(activityRepository.findByIdAndItineraryId(500L, 100L)).thenReturn(Optional.of(existingActivity));

        LocalTime newStart = LocalTime.of(11, 0);
        LocalTime newEnd = LocalTime.of(13, 0);

        when(activityRepository.existsOverlappingActivityForItineraryExcludingActivity(100L, 500L, newStart, newEnd)).thenReturn(true);

        UpdateActivityRequest request = UpdateActivityRequest.builder()
                .title("Updated Activity")
                .activityType(ActivityType.ADVENTURE)
                .location("Park")
                .startTime(newStart)
                .endTime(newEnd)
                .estimatedCost(300.0)
                .build();

        ActivityOverlapException ex = assertThrows(ActivityOverlapException.class, () -> {
            activityService.updateActivity(10L, 100L, 500L, request);
        });

        assertEquals("This activity overlaps with an existing activity on this itinerary day. Please choose a different time range.", ex.getMessage());
    }
}
