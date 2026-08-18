package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.tripnest.tripnest.TripnestApplication;
import com.tripnest.tripnest.dto.AdminAnalyticsResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;
import com.tripnest.tripnest.repository.RoleRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.security.JwtService;

@SpringBootTest(
        classes = TripnestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.jwt.secret=test-jwt-secret-key-for-context-loading-123456789012345678901234567890",
                "app.jwt.expiration-ms=3600000"
        }
)
public class AdminControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RestTemplate restTemplate;
    private User normalUser;
    private User adminUser;
    private String userToken;
    private String adminToken;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbcTemplate.execute("DELETE FROM activity_logs");
        jdbcTemplate.execute("DELETE FROM trip_reminders");
        jdbcTemplate.execute("DELETE FROM trip_chat_messages");
        jdbcTemplate.execute("DELETE FROM trip_invitations");
        jdbcTemplate.execute("DELETE FROM trip_members");
        jdbcTemplate.execute("DELETE FROM expense_splits");
        jdbcTemplate.execute("DELETE FROM expenses");
        jdbcTemplate.execute("DELETE FROM activities");
        jdbcTemplate.execute("DELETE FROM itineraries");
        jdbcTemplate.execute("DELETE FROM documents");
        jdbcTemplate.execute("DELETE FROM password_reset_tokens");
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute("DELETE FROM trips");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        Role roleTraveler = roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_TRAVELER).build()));

        Role roleAdmin = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));

        normalUser = userRepository.save(User.builder()
                .fullName("Normal Traveler")
                .email("traveler@example.com")
                .password(passwordEncoder.encode("password123"))
                .roles(Set.of(roleTraveler))
                .build());

        adminUser = userRepository.save(User.builder()
                .fullName("System Admin")
                .email("admin@example.com")
                .password(passwordEncoder.encode("password123"))
                .roles(Set.of(roleAdmin))
                .build());

        userToken = jwtService.generateToken(new CustomUserDetails(normalUser));
        adminToken = jwtService.generateToken(new CustomUserDetails(adminUser));
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
            restTemplate.getForEntity(getBaseUrl() + "/api/admin/analytics", String.class);
            fail("Expected HTTP 401 Unauthorized");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }
    }

    @Test
    void whenAuthenticatedAsUser_shouldReturn403Forbidden() {
        HttpHeaders headers = getHeaders(userToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(
                    getBaseUrl() + "/api/admin/analytics",
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            fail("Expected HTTP 403 Forbidden");
        } catch (HttpStatusCodeException ex) {
            assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        }
    }

    @Test
    void whenAuthenticatedAsAdmin_shouldReturn200AndAnalytics() {
        HttpHeaders headers = getHeaders(adminToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<AdminAnalyticsResponse> response = restTemplate.exchange(
                getBaseUrl() + "/api/admin/analytics",
                HttpMethod.GET,
                entity,
                AdminAnalyticsResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        AdminAnalyticsResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(2, body.getTotalUsers());
    }
}
