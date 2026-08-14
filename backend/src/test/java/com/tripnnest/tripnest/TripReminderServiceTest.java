package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripReminder;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripReminderRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.service.EmailService;
import com.tripnest.tripnest.service.TripReminderService;

public class TripReminderServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripReminderRepository tripReminderRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private TripReminderService tripReminderService;

    private final String timezone = "Asia/Kolkata";
    private ZoneId zoneId;
    private LocalDate today;
    private LocalDate tomorrow;
    private User user1;
    private User user2;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(tripReminderService, "timezoneStr", timezone);
        zoneId = ZoneId.of(timezone);
        today = LocalDate.now(zoneId);
        tomorrow = today.plusDays(1);

        user1 = User.builder().id(1L).email("user1@example.com").fullName("User One").build();
        user2 = User.builder().id(2L).email("user2@example.com").fullName("User Two").build();
    }

    @Test
    public void test1_TripStartsTomorrow_ReminderSentAndRecorded() {
        Trip trip = Trip.builder().id(101L).title("Tomorrow Trip").destination("Goa")
                .startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(5000.0)
                .status(TripStatus.UPCOMING).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));
        when(tripReminderRepository.existsByTripIdAndReminderType(101L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(false);

        int sent = tripReminderService.processTripReminders();

        assertEquals(1, sent);
        verify(emailService, times(1)).sendTripReminderEmail(user1, trip);
        verify(tripReminderRepository, times(1)).save(any(TripReminder.class));
    }

    @Test
    public void test2_TripStartsToday_NoReminderSent() {
        Trip trip = Trip.builder().id(102L).title("Today Trip").destination("Goa")
                .startDate(today).endDate(today.plusDays(3)).travelers(2).budget(5000.0)
                .status(TripStatus.ONGOING).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));

        int sent = tripReminderService.processTripReminders();

        assertEquals(0, sent);
        verify(emailService, never()).sendTripReminderEmail(any(), any());
        verify(tripReminderRepository, never()).save(any());
    }

    @Test
    public void test3_TripStartsIn2Days_NoReminderSent() {
        Trip trip = Trip.builder().id(103L).title("Future Trip").destination("Goa")
                .startDate(today.plusDays(2)).endDate(today.plusDays(5)).travelers(2).budget(5000.0)
                .status(TripStatus.UPCOMING).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));

        int sent = tripReminderService.processTripReminders();

        assertEquals(0, sent);
        verify(emailService, never()).sendTripReminderEmail(any(), any());
        verify(tripReminderRepository, never()).save(any());
    }

    @Test
    public void test4_TripCompleted_NoReminderSent() {
        Trip trip = Trip.builder().id(104L).title("Completed Trip").destination("Goa")
                .startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(5000.0)
                .status(TripStatus.COMPLETED).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));

        int sent = tripReminderService.processTripReminders();

        assertEquals(0, sent);
        verify(emailService, never()).sendTripReminderEmail(any(), any());
        verify(tripReminderRepository, never()).save(any());
    }

    @Test
    public void test5_TripCancelled_NoReminderSent() {
        Trip trip = Trip.builder().id(105L).title("Cancelled Trip").destination("Goa")
                .startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(5000.0)
                .status(TripStatus.CANCELLED).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));

        int sent = tripReminderService.processTripReminders();

        assertEquals(0, sent);
        verify(emailService, never()).sendTripReminderEmail(any(), any());
        verify(tripReminderRepository, never()).save(any());
    }

    @Test
    public void test6_ReminderAlreadySent_DuplicatePrevented() {
        Trip trip = Trip.builder().id(106L).title("Already Reminded Trip").destination("Goa")
                .startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(5000.0)
                .status(TripStatus.UPCOMING).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));
        when(tripReminderRepository.existsByTripIdAndReminderType(106L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(true);

        int sent = tripReminderService.processTripReminders();

        assertEquals(0, sent);
        verify(emailService, never()).sendTripReminderEmail(any(), any());
        verify(tripReminderRepository, never()).save(any());
    }

    @Test
    public void test7_EmailSendingFails_ReminderNotMarkedAsSent() {
        Trip trip = Trip.builder().id(107L).title("Failing Email Trip").destination("Goa")
                .startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(5000.0)
                .status(TripStatus.UPCOMING).user(user1).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip));
        when(tripReminderRepository.existsByTripIdAndReminderType(107L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(false);
        doThrow(new RuntimeException("SMTP Server Unavailable")).when(emailService).sendTripReminderEmail(user1, trip);

        int sent = tripReminderService.processTripReminders();

        assertEquals(0, sent);
        verify(emailService, times(1)).sendTripReminderEmail(user1, trip);
        verify(tripReminderRepository, never()).save(any());
    }

    @Test
    public void test8_MultipleTripsStartTomorrow_EachEligibleReceivesReminder() {
        Trip trip1 = Trip.builder().id(108L).title("Trip 1").destination("Goa").startDate(tomorrow).endDate(tomorrow.plusDays(2)).travelers(2).budget(5000.0).status(TripStatus.UPCOMING).user(user1).build();
        Trip trip2 = Trip.builder().id(109L).title("Trip 2").destination("Manali").startDate(tomorrow).endDate(tomorrow.plusDays(4)).travelers(3).budget(8000.0).status(TripStatus.PLANNING).user(user2).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip1, trip2));
        when(tripReminderRepository.existsByTripIdAndReminderType(108L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(false);
        when(tripReminderRepository.existsByTripIdAndReminderType(109L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(false);

        int sent = tripReminderService.processTripReminders();

        assertEquals(2, sent);
        verify(emailService, times(1)).sendTripReminderEmail(user1, trip1);
        verify(emailService, times(1)).sendTripReminderEmail(user2, trip2);
        verify(tripReminderRepository, times(2)).save(any(TripReminder.class));
    }

    @Test
    public void test9_DifferentUsers_SentToCorrectUserEmail() {
        Trip trip1 = Trip.builder().id(110L).title("User1 Trip").destination("Kerala").startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(6000.0).status(TripStatus.UPCOMING).user(user1).build();
        Trip trip2 = Trip.builder().id(111L).title("User2 Trip").destination("Jaipur").startDate(tomorrow).endDate(tomorrow.plusDays(3)).travelers(2).budget(7000.0).status(TripStatus.UPCOMING).user(user2).build();

        when(tripRepository.findAll()).thenReturn(List.of(trip1, trip2));
        when(tripReminderRepository.existsByTripIdAndReminderType(110L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(false);
        when(tripReminderRepository.existsByTripIdAndReminderType(111L, TripReminderService.REMINDER_TYPE_1_DAY)).thenReturn(false);

        int sent = tripReminderService.processTripReminders();

        assertEquals(2, sent);
        verify(emailService).sendTripReminderEmail(eq(user1), eq(trip1));
        verify(emailService).sendTripReminderEmail(eq(user2), eq(trip2));
    }
}
