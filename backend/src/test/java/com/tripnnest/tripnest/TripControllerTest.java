package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.tripnest.TripnestApplication;
import com.tripnest.tripnest.dto.CreateTripRequest;
import com.tripnest.tripnest.dto.TripResponse;
import com.tripnest.tripnest.dto.UpdateTripRequest;
import com.tripnest.tripnest.dto.CreateItineraryRequest;
import com.tripnest.tripnest.dto.ItineraryResponse;
import com.tripnest.tripnest.dto.UpdateItineraryRequest;
import com.tripnest.tripnest.dto.CreateActivityRequest;
import com.tripnest.tripnest.dto.ActivityResponse;
import com.tripnest.tripnest.dto.UpdateActivityRequest;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.model.Itinerary;
import com.tripnest.tripnest.model.Activity;
import com.tripnest.tripnest.model.ActivityType;
import com.tripnest.tripnest.repository.PasswordResetTokenRepository;
import com.tripnest.tripnest.repository.RoleRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.repository.ItineraryRepository;
import com.tripnest.tripnest.repository.ActivityRepository;
import com.tripnest.tripnest.security.JwtService;

@SpringBootTest(
        classes = TripnestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "app.jwt.secret=test-jwt-secret-key-for-context-loading-123456",
                "app.jwt.expiration-ms=3600000"
        }
)
public class TripControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private ObjectMapper objectMapper;
    private RestTemplate restTemplate;
    private User user1;
    private User user2;
    private String token1;
    private String token2;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        restTemplate = new RestTemplate();
        activityRepository.deleteAll();
        itineraryRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        tripRepository.deleteAll();
        userRepository.deleteAll();

        Role roleTraveler = roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_TRAVELER).build()));

        user1 = userRepository.save(User.builder()
                .fullName("User One")
                .email("user1@example.com")
                .password(passwordEncoder.encode("password123"))
                .roles(Set.of(roleTraveler))
                .build());

        user2 = userRepository.save(User.builder()
                .fullName("User Two")
                .email("user2@example.com")
                .password(passwordEncoder.encode("password123"))
                .roles(Set.of(roleTraveler))
                .build());

        token1 = jwtService.generateToken(new CustomUserDetails(user1));
        token2 = jwtService.generateToken(new CustomUserDetails(user2));
    }

    private HttpHeaders getHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return headers;
    }

    @Test
    void whenUnauthenticated_shouldReturn401() {
        try {
            restTemplate.getForEntity(getBaseUrl() + "/api/trips", String.class);
            fail("Expected HTTP 401 Unauthorized");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }
    }

    @Test
    void whenAuthenticated_shouldCreateTrip() {
        CreateTripRequest request = CreateTripRequest.builder()
                .title("Summer Escape")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(20))
                .travelers(2)
                .budget(5000.0)
                .description("Romantic summer trip")
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<CreateTripRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<TripResponse> response = restTemplate.postForEntity(getBaseUrl() + "/api/trips", entity, TripResponse.class);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        TripResponse body = response.getBody();
        assertNotNull(body);
        assertEquals("Summer Escape", body.getTitle());
        assertEquals("Paris", body.getDestination());
        assertEquals(2, body.getTravelers());
        assertEquals(5000.0, body.getBudget());
        assertEquals(TripStatus.PLANNING, body.getStatus());
        assertEquals(user1.getId(), body.getOwnerId());
    }

    @Test
    void shouldRetrieveOnlyUserTrips() {
        tripRepository.save(Trip.builder()
                .title("Trip A")
                .destination("Destination A")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(1)
                .budget(1000.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        tripRepository.save(Trip.builder()
                .title("Trip B")
                .destination("Destination B")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(1)
                .budget(2000.0)
                .status(TripStatus.PLANNING)
                .user(user2)
                .build());

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<List<TripResponse>> response = restTemplate.exchange(
                getBaseUrl() + "/api/trips",
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<List<TripResponse>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<TripResponse> body = response.getBody();
        assertNotNull(body);
        assertEquals(1, body.size());
        assertEquals("Trip A", body.get(0).getTitle());
    }

    @Test
    void shouldRetrieveTripById() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("My Trip")
                .destination("Tokyo")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(15))
                .travelers(3)
                .budget(4000.0)
                .status(TripStatus.UPCOMING)
                .user(user1)
                .build());

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<TripResponse> response = restTemplate.exchange(
                getBaseUrl() + "/api/trips/" + trip.getId(),
                HttpMethod.GET,
                entity,
                TripResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        TripResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(trip.getId(), body.getId());
        assertEquals("My Trip", body.getTitle());
    }

    @Test
    void shouldUpdateOwnTrip() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("My Old Trip")
                .destination("Tokyo")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(15))
                .travelers(3)
                .budget(4000.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        UpdateTripRequest updateRequest = UpdateTripRequest.builder()
                .title("My Updated Trip")
                .destination("Kyoto")
                .startDate(LocalDate.now().plusDays(6))
                .endDate(LocalDate.now().plusDays(16))
                .travelers(4)
                .budget(4500.0)
                .status(TripStatus.UPCOMING)
                .description("Updated Tokyo to Kyoto")
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<UpdateTripRequest> entity = new HttpEntity<>(updateRequest, headers);

        ResponseEntity<TripResponse> response = restTemplate.exchange(
                getBaseUrl() + "/api/trips/" + trip.getId(),
                HttpMethod.PUT,
                entity,
                TripResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        TripResponse body = response.getBody();
        assertNotNull(body);
        assertEquals("My Updated Trip", body.getTitle());
        assertEquals("Kyoto", body.getDestination());
        assertEquals(4, body.getTravelers());
        assertEquals(TripStatus.UPCOMING, body.getStatus());
    }

    @Test
    void shouldDeleteOwnTrip() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Trip to Delete")
                .destination("Berlin")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(15))
                .travelers(1)
                .budget(1000.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Void> response = restTemplate.exchange(
                getBaseUrl() + "/api/trips/" + trip.getId(),
                HttpMethod.DELETE,
                entity,
                Void.class
        );

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());

        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + trip.getId(),
                    HttpMethod.GET,
                    entity,
                    TripResponse.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }
    }

    @Test
    void whenEndDateBeforeStartDate_shouldReturn400() {
        CreateTripRequest request = CreateTripRequest.builder()
                .title("Invalid Date Trip")
                .destination("Rome")
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(5)) // invalid
                .travelers(1)
                .budget(100.0)
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<CreateTripRequest> entity = new HttpEntity<>(request, headers);

        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips",
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            fail("Expected HTTP 400 Bad Request");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            try {
                Map<?, ?> body = objectMapper.readValue(ex.getResponseBodyAsString(), Map.class);
                assertEquals("End date cannot be before start date", body.get("message"));
            } catch (Exception e) {
                fail("Failed to parse error response body", e);
            }
        }
    }

    @Test
    void whenBudgetNegative_shouldReturn400() {
        CreateTripRequest request = CreateTripRequest.builder()
                .title("Negative Budget")
                .destination("Rome")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(1)
                .budget(-100.0) // invalid
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<CreateTripRequest> entity = new HttpEntity<>(request, headers);

        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips",
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            fail("Expected HTTP 400 Bad Request");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            try {
                Map<?, ?> body = objectMapper.readValue(ex.getResponseBodyAsString(), Map.class);
                assertEquals("Validation failed", body.get("message"));
                Map<?, ?> errors = (Map<?, ?>) body.get("errors");
                assertNotNull(errors);
                assertEquals("Budget cannot be negative", errors.get("budget"));
            } catch (Exception e) {
                fail("Failed to parse error response body", e);
            }
        }
    }

    @Test
    void whenAccessingAnotherUserTrip_shouldReturn404() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Private Trip")
                .destination("Berlin")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(15))
                .travelers(1)
                .budget(1000.0)
                .status(TripStatus.PLANNING)
                .user(user2)
                .build());

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        // Try GET
        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + trip.getId(),
                    HttpMethod.GET,
                    entity,
                    TripResponse.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }

        // Try PUT
        UpdateTripRequest updateRequest = UpdateTripRequest.builder()
                .title("Hacked Trip")
                .destination("Kyoto")
                .startDate(LocalDate.now().plusDays(6))
                .endDate(LocalDate.now().plusDays(16))
                .travelers(4)
                .budget(4500.0)
                .status(TripStatus.UPCOMING)
                .build();
        HttpEntity<UpdateTripRequest> putEntity = new HttpEntity<>(updateRequest, headers);

        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + trip.getId(),
                    HttpMethod.PUT,
                    putEntity,
                    TripResponse.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }

        // Try DELETE
        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + trip.getId(),
                    HttpMethod.DELETE,
                    entity,
                    Void.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }
    }

    @Test
    void whenUnauthenticated_shouldBlockItineraryApis() {
        try {
            restTemplate.getForEntity(getBaseUrl() + "/api/trips/1/itineraries", String.class);
            fail("Expected HTTP 401 Unauthorized");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }
    }

    @Test
    void shouldCreateAndRetrieveItineraryDays() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Trip C")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        CreateItineraryRequest request = CreateItineraryRequest.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(6))
                .title("Day 1: Arrival")
                .notes("Check in at hotel")
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<CreateItineraryRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<ItineraryResponse> response = restTemplate.postForEntity(
                getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries",
                entity,
                ItineraryResponse.class
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        ItineraryResponse body = response.getBody();
        assertNotNull(body);
        assertEquals("Day 1: Arrival", body.getTitle());
        assertEquals(1, body.getDayNumber());

        // retrieve
        ResponseEntity<List<ItineraryResponse>> listResponse = restTemplate.exchange(
                getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<ItineraryResponse>>() {}
        );
        assertEquals(HttpStatus.OK, listResponse.getStatusCode());
        assertNotNull(listResponse.getBody());
        assertEquals(1, listResponse.getBody().size());
    }

    @Test
    void whenItineraryDateOutOfBounds_shouldReturn400() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Trip C")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        CreateItineraryRequest request = CreateItineraryRequest.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(20)) // out of bounds
                .title("Invalid Day")
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<CreateItineraryRequest> entity = new HttpEntity<>(request, headers);

        try {
            restTemplate.postForEntity(
                    getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries",
                    entity,
                    String.class
            );
            fail("Expected HTTP 400 Bad Request");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        }
    }

    @Test
    void whenDuplicateDayNumberOrDate_shouldReturn400() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Trip C")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        itineraryRepository.save(Itinerary.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(5))
                .title("Day 1")
                .trip(trip)
                .build());

        // Try duplicate dayNumber
        CreateItineraryRequest dupDayRequest = CreateItineraryRequest.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(6))
                .title("Duplicate Day")
                .build();

        HttpHeaders headers = getHeaders(token1);

        try {
            restTemplate.postForEntity(
                    getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries",
                    new HttpEntity<>(dupDayRequest, headers),
                    String.class
            );
            fail("Expected HTTP 400 Bad Request");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        }

        // Try duplicate date
        CreateItineraryRequest dupDateRequest = CreateItineraryRequest.builder()
                .dayNumber(2)
                .date(LocalDate.now().plusDays(5))
                .title("Duplicate Date")
                .build();

        try {
            restTemplate.postForEntity(
                    getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries",
                    new HttpEntity<>(dupDateRequest, headers),
                    String.class
            );
            fail("Expected HTTP 400 Bad Request");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        }
    }

    @Test
    void whenUserANoAccessUserBTripItinerary_shouldReturn404() {
        Trip tripB = tripRepository.save(Trip.builder()
                .title("User B Trip")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user2)
                .build());

        Itinerary itineraryB = itineraryRepository.save(Itinerary.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(5))
                .title("Day 1 B")
                .trip(tripB)
                .build());

        HttpHeaders headersA = getHeaders(token1);
        HttpEntity<Void> entityA = new HttpEntity<>(headersA);

        // Try GET user B trip itineraries using user A token
        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + tripB.getId() + "/itineraries",
                    HttpMethod.GET,
                    entityA,
                    String.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }

        // Try GET individual itinerary
        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + tripB.getId() + "/itineraries/" + itineraryB.getId(),
                    HttpMethod.GET,
                    entityA,
                    String.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }
    }

    @Test
    void shouldCreateAndRetrieveActivities() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Trip D")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        Itinerary itinerary = itineraryRepository.save(Itinerary.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(6))
                .title("Day 1")
                .trip(trip)
                .build());

        CreateActivityRequest request = CreateActivityRequest.builder()
                .title("Eiffel Tower visit")
                .description("Sightseeing activity")
                .location("Eiffel Tower")
                .startTime(java.time.LocalTime.of(10, 0))
                .endTime(java.time.LocalTime.of(12, 30))
                .activityType(ActivityType.SIGHTSEEING)
                .estimatedCost(150.0)
                .build();

        HttpHeaders headers = getHeaders(token1);
        HttpEntity<CreateActivityRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<ActivityResponse> response = restTemplate.postForEntity(
                getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries/" + itinerary.getId() + "/activities",
                entity,
                ActivityResponse.class
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        ActivityResponse body = response.getBody();
        assertNotNull(body);
        assertEquals("Eiffel Tower visit", body.getTitle());
        assertEquals(ActivityType.SIGHTSEEING, body.getActivityType());

        // retrieve
        ResponseEntity<List<ActivityResponse>> listResponse = restTemplate.exchange(
                getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries/" + itinerary.getId() + "/activities",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<ActivityResponse>>() {}
        );
        assertEquals(HttpStatus.OK, listResponse.getStatusCode());
        assertNotNull(listResponse.getBody());
        assertEquals(1, listResponse.getBody().size());
        assertEquals("Eiffel Tower visit", listResponse.getBody().get(0).getTitle());
    }

    @Test
    void whenEndTimeBeforeStartTime_shouldReturn400() {
        Trip trip = tripRepository.save(Trip.builder()
                .title("Trip D")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        Itinerary itinerary = itineraryRepository.save(Itinerary.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(6))
                .title("Day 1")
                .trip(trip)
                .build());

        CreateActivityRequest request = CreateActivityRequest.builder()
                .title("Invalid Time Activity")
                .startTime(java.time.LocalTime.of(12, 0))
                .endTime(java.time.LocalTime.of(10, 0)) // invalid end time
                .activityType(ActivityType.ADVENTURE)
                .estimatedCost(10.0)
                .build();

        HttpHeaders headers = getHeaders(token1);

        try {
            restTemplate.postForEntity(
                    getBaseUrl() + "/api/trips/" + trip.getId() + "/itineraries/" + itinerary.getId() + "/activities",
                    new HttpEntity<>(request, headers),
                    String.class
            );
            fail("Expected HTTP 400 Bad Request");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        }
    }

    @Test
    void whenCrossResourceMappingActivityRequested_shouldReturn404() {
        Trip trip1 = tripRepository.save(Trip.builder()
                .title("User 1 Trip")
                .destination("Paris")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user1)
                .build());

        Itinerary itinerary1 = itineraryRepository.save(Itinerary.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(6))
                .title("Day 1")
                .trip(trip1)
                .build());

        Trip trip2 = tripRepository.save(Trip.builder()
                .title("User 2 Trip")
                .destination("London")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(10))
                .travelers(2)
                .budget(500.0)
                .status(TripStatus.PLANNING)
                .user(user2)
                .build());

        Itinerary itinerary2 = itineraryRepository.save(Itinerary.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(6))
                .title("Day 1 B")
                .trip(trip2)
                .build());

        Activity activity2 = activityRepository.save(Activity.builder()
                .title("User 2 Activity")
                .activityType(ActivityType.SIGHTSEEING)
                .estimatedCost(0.0)
                .itinerary(itinerary2)
                .build());

        HttpHeaders headers1 = getHeaders(token1);
        HttpEntity<Void> entity1 = new HttpEntity<>(headers1);

        // Try getting User 2's activity using User 1's credentials via User 1's trip/itinerary IDs
        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + trip1.getId() + "/itineraries/" + itinerary1.getId() + "/activities/" + activity2.getId(),
                    HttpMethod.GET,
                    entity1,
                    String.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }

        // Try getting User 2's activity using User 1's credentials with User 2's trip/itinerary IDs (should return 404 due to trip ownership)
        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/trips/" + trip2.getId() + "/itineraries/" + itinerary2.getId() + "/activities/" + activity2.getId(),
                    HttpMethod.GET,
                    entity1,
                    String.class
            );
            fail("Expected HTTP 404 Not Found");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        }
    }
}
