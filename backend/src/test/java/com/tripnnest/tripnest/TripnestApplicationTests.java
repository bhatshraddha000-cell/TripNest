package com.tripnnest.tripnest;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import com.tripnest.tripnest.TripnestApplication;

@SpringBootTest(
		classes = TripnestApplication.class,
		properties = {
				"app.jwt.secret=test-jwt-secret-key-for-context-loading-123456",
				"app.jwt.expiration-ms=3600000"
		}
)
class TripnestApplicationTests {

	@Test
	void contextLoads() {
	}

}
