package com.tripnnest.tripnest;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import com.tripnest.tripnest.TripnestApplication;

@SpringBootTest(
		classes = TripnestApplication.class,
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
class TripnestApplicationTests {

	@Test
	void contextLoads() {
	}

}
