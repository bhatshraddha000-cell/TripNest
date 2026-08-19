package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.TripnestApplication;
import com.tripnest.tripnest.dto.CreateTripRequest;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.ActivityType;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.RoleRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.TripService;

@SpringBootTest(classes = TripnestApplication.class)
public class TripDeleteCascadeTest {

    @Autowired
    private TripService tripService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        activityRepository.deleteAll();
        itineraryRepository.deleteAll();
        tripRepository.deleteAll();

        Role role = roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_TRAVELER).build()));

        testUser = userRepository.findByEmail("testcascade@example.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Cascade User")
                        .email("testcascade@example.com")
                        .password("password123")
                        .roles(java.util.Set.of(role))
                        .build()));

        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testDeleteTripWithItineraryAndActivities_Success() {
        // 1. Create a trip
        CreateTripRequest tripReq = new CreateTripRequest();
        tripReq.setTitle("Cascade Test Trip");
        tripReq.setDestination("Paris");
        tripReq.setStartDate(LocalDate.now().plusDays(10));
        tripReq.setEndDate(LocalDate.now().plusDays(15));
        tripReq.setTravelers(2);
        tripReq.setBudget(1500.0);
        tripReq.setStatus(TripStatus.PLANNING);

        TripResponse tripResp = tripService.createTrip(tripReq);
        Long tripId = tripResp.getId();

        // 2. Add an itinerary day
        Itinerary itinerary = Itinerary.builder()
                .trip(tripRepository.findById(tripId).orElseThrow())
                .dayNumber(1)
                .date(LocalDate.now().plusDays(10))
                .title("Day 1 - Arrival")
                .notes("Check into hotel")
                .build();
        Itinerary savedItinerary = itineraryRepository.save(itinerary);

        // 3. Add an activity to the itinerary
        Activity activity = Activity.builder()
                .itinerary(savedItinerary)
                .title("Eiffel Tower Visit")
                .activityType(ActivityType.SIGHTSEEING)
                .estimatedCost(50.0)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .build();
        activityRepository.save(activity);

        // Verify entities exist in database before deletion
        assertTrue(tripRepository.existsById(tripId));
        assertEquals(1, itineraryRepository.findByTripIdOrderByDateAscDayNumberAsc(tripId).size());

        // 4. Delete the trip
        assertDoesNotThrow(() -> tripService.deleteTrip(tripId));

        // 5. Assert trip, itineraries, and activities are removed cleanly
        assertFalse(tripRepository.existsById(tripId));
        assertTrue(itineraryRepository.findByTripIdOrderByDateAscDayNumberAsc(tripId).isEmpty());
    }
}
