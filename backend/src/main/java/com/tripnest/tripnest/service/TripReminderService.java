package com.tripnest.tripnest.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripReminder;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripReminderRepository;
import com.tripnest.tripnest.repository.TripRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripReminderService {

    public static final String REMINDER_TYPE_1_DAY = "TRIP_START_1_DAY";

    private final TripRepository tripRepository;
    private final TripReminderRepository tripReminderRepository;
    private final EmailService emailService;

    @Value("${app.tripnest.reminder.timezone:Asia/Kolkata}")
    private String timezoneStr;

    public int processTripReminders() {
        log.info("Trip reminder test started");

        ZoneId zoneId = ZoneId.of(timezoneStr);
        LocalDate today = LocalDate.now(zoneId);
        LocalDate tomorrow = today.plusDays(1);

        log.info("Running Trip Reminder check for tomorrow: {} (App Timezone: {})", tomorrow, timezoneStr);

        List<Trip> allTrips = tripRepository.findAll();
        List<Trip> eligibleTrips = allTrips.stream()
                .filter(t -> t.getStartDate() != null && t.getStartDate().equals(tomorrow))
                .filter(t -> t.getStatus() != TripStatus.CANCELLED && t.getStatus() != TripStatus.COMPLETED)
                .toList();

        log.info("Eligible trips found: {}", eligibleTrips.size());

        int sentCount = 0;

        for (Trip trip : eligibleTrips) {
            if (tripReminderRepository.existsByTripIdAndReminderType(trip.getId(), REMINDER_TYPE_1_DAY)) {
                log.info("Trip reminder already sent for trip ID: {} ({}). Skipping.", trip.getId(), trip.getTitle());
                continue;
            }

            User owner = trip.getUser();
            if (owner == null || owner.getEmail() == null || owner.getEmail().trim().isEmpty()) {
                log.warn("Trip ID: {} ({}) has no valid owner email address. Skipping.", trip.getId(), trip.getTitle());
                continue;
            }

            try {
                emailService.sendTripReminderEmail(owner, trip);

                TripReminder reminder = TripReminder.builder()
                        .trip(trip)
                        .user(owner)
                        .reminderType(REMINDER_TYPE_1_DAY)
                        .scheduledFor(tomorrow)
                        .sentAt(LocalDateTime.now(zoneId))
                        .build();

                tripReminderRepository.save(reminder);
                sentCount++;
                log.info("Reminder email sent to: {}", owner.getEmail());
                log.info("Successfully sent and recorded 1-day reminder for trip ID: {} to user: {}", trip.getId(), owner.getEmail());
            } catch (Exception ex) {
                log.error("Failed to process reminder for trip ID: {} ({}). Exception: {}. Reminder NOT marked as sent.",
                        trip.getId(), trip.getTitle(), ex.getMessage());
            }
        }

        log.info("Trip Reminder check completed. Total reminders sent: {}", sentCount);
        return sentCount;
    }
}
