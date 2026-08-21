package com.tripnest.tripnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TripnestApplication {

	public static void main(String[] args) {
		SpringApplication.run(TripnestApplication.class, args);
	}

}
