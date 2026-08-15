package com.tripnest.tripnest.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.tripnest.tripnest.service.TripReminderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class TripReminderScheduler {

    private final TripReminderService tripReminderService;

    /**
     * Daily trip reminder check execution.
     * Default schedule: 9:00 AM daily (configured via app.tripnest.reminder.cron).
     */
    @Scheduled(cron = "${app.tripnest.reminder.cron:0 0 9 * * *}")
    public void runDailyTripReminders() {
        log.info("Triggering scheduled daily trip reminders...");
        try {
            int sent = tripReminderService.processTripReminders();
            log.info("Scheduled daily trip reminders execution completed. Reminders sent: {}", sent);
        } catch (Exception e) {
            log.error("Unhandled error during scheduled daily trip reminders: {}", e.getMessage(), e);
        }
    }
}
