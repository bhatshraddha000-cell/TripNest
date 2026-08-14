package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripInvitation;
import com.tripnest.tripnest.model.TripInvitationStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripInvitationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.ActivityLogService;
import com.tripnest.tripnest.service.GroupCollaborationService;
import com.tripnest.tripnest.service.NotificationService;

public class TripInvitationRejectionTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private TripInvitationRepository tripInvitationRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private GroupCollaborationService groupCollaborationService;

    private User inviter;
    private User receiver;
    private Trip trip;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        inviter = User.builder().id(1L).fullName("Rahul Sharma").email("rahul@example.com").build();
        receiver = User.builder().id(2L).fullName("Priya Patel").email("priya@example.com").build();
        trip = Trip.builder().id(100L).title("Karnataka").user(inviter).build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("priya@example.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(receiver));
    }

    @Test
    public void testRejectInvitation_NotifiesInviter() {
        TripInvitation invitation = TripInvitation.builder()
                .id(10L)
                .trip(trip)
                .sender(inviter)
                .receiver(receiver)
                .status(TripInvitationStatus.PENDING)
                .build();

        when(tripInvitationRepository.findById(10L)).thenReturn(Optional.of(invitation));

        groupCollaborationService.rejectInvitation(10L);

        assertEquals(TripInvitationStatus.REJECTED, invitation.getStatus());

        // Verify inviter receives exact rejection notification
        verify(notificationService).createNotification(
                eq(inviter),
                eq("Trip invitation rejected"),
                eq("Priya Patel rejected your invitation to join Karnataka."),
                eq("INVITATION_REJECTED")
        );
    }
}
