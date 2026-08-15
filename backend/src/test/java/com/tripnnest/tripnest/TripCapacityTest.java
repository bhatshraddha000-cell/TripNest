package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.dto.InviteMemberRequest;
import com.tripnest.tripnest.dto.UpdateTripRequest;
import com.tripnest.tripnest.exception.TripCapacityException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripInvitation;
import com.tripnest.tripnest.model.TripInvitationStatus;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.TripStatus;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.ActivityLogRepository;
import com.tripnest.tripnest.repository.DocumentRepository;
import com.tripnest.tripnest.repository.ExpenseRepository;
import com.tripnest.tripnest.repository.ExpenseSplitRepository;
import com.tripnest.tripnest.repository.TripInvitationRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.ActivityLogService;
import com.tripnest.tripnest.service.GroupCollaborationService;
import com.tripnest.tripnest.service.NotificationService;
import com.tripnest.tripnest.service.TripService;

public class TripCapacityTest {

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

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private GroupCollaborationService groupCollaborationService;

    @InjectMocks
    private TripService tripService;

    private User admin;
    private User companion;
    private Trip trip;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        admin = User.builder().id(1L).fullName("Admin User").email("admin@tripnest.com").build();
        companion = User.builder().id(2L).fullName("Companion User").email("companion@tripnest.com").build();
        trip = Trip.builder().id(100L).title("Bali Escape").travelers(3).user(admin).build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("admin@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("admin@tripnest.com")).thenReturn(Optional.of(admin));
        when(userRepository.findByEmail("companion@tripnest.com")).thenReturn(Optional.of(companion));
        when(tripRepository.findById(100L)).thenReturn(Optional.of(trip));
    }

    @Test
    public void testInviteMember_CapacityAvailable_Success() {
        TripMember adminMember = TripMember.builder().trip(trip).user(admin).tripRole(TripMemberRole.GROUP_ADMIN).build();
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(adminMember));
        when(tripMemberRepository.countByTripId(100L)).thenReturn(1L); // Admin = 1 member
        when(tripInvitationRepository.countByTripIdAndStatus(100L, TripInvitationStatus.PENDING)).thenReturn(0L);

        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(false);
        when(tripInvitationRepository.findByTripIdAndReceiverIdAndStatus(100L, 2L, TripInvitationStatus.PENDING)).thenReturn(Optional.empty());

        when(tripInvitationRepository.save(any(TripInvitation.class))).thenAnswer(i -> {
            TripInvitation inv = i.getArgument(0);
            inv.setId(50L);
            return inv;
        });

        InviteMemberRequest request = InviteMemberRequest.builder().emailOrUsername("companion@tripnest.com").build();

        var response = groupCollaborationService.inviteMember(100L, request);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
    }

    @Test
    public void testInviteMember_CapacityFull_ThrowsTripCapacityException() {
        TripMember adminMember = TripMember.builder().trip(trip).user(admin).tripRole(TripMemberRole.GROUP_ADMIN).build();
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(adminMember));
        when(tripMemberRepository.countByTripId(100L)).thenReturn(3L); // Already 3/3 full
        when(tripInvitationRepository.countByTripIdAndStatus(100L, TripInvitationStatus.PENDING)).thenReturn(0L);

        InviteMemberRequest request = InviteMemberRequest.builder().emailOrUsername("companion@tripnest.com").build();

        TripCapacityException ex = assertThrows(TripCapacityException.class, () -> {
            groupCollaborationService.inviteMember(100L, request);
        });

        assertEquals("This trip has reached its maximum capacity of 3 travelers.", ex.getMessage());
    }

    @Test
    public void testAcceptInvitation_CapacityFull_ThrowsTripCapacityException() {
        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("companion@tripnest.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("companion@tripnest.com")).thenReturn(Optional.of(companion));

        TripInvitation invitation = TripInvitation.builder()
                .id(10L)
                .trip(trip)
                .sender(admin)
                .receiver(companion)
                .status(TripInvitationStatus.PENDING)
                .build();

        when(tripInvitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(tripMemberRepository.countByTripId(100L)).thenReturn(3L); // Capacity 3/3 full

        TripCapacityException ex = assertThrows(TripCapacityException.class, () -> {
            groupCollaborationService.acceptInvitation(10L);
        });

        assertEquals("This trip has reached its maximum capacity of 3 travelers.", ex.getMessage());
    }

    @Test
    public void testUpdateTrip_ReduceCapacityBelowCurrentMembers_ThrowsTripCapacityException() {
        TripMember adminMember = TripMember.builder().trip(trip).user(admin).tripRole(TripMemberRole.GROUP_ADMIN).build();
        when(tripMemberRepository.findByTripIdAndUserId(100L, 1L)).thenReturn(Optional.of(adminMember));
        when(tripRepository.findById(100L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.countByTripId(100L)).thenReturn(4L); // Currently 4 members

        UpdateTripRequest request = UpdateTripRequest.builder()
                .title("Bali Escape")
                .destination("Bali")
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 10))
                .travelers(3) // Trying to set max capacity to 3 < 4 members
                .budget(50000.0)
                .status(TripStatus.PLANNING)
                .build();

        TripCapacityException ex = assertThrows(TripCapacityException.class, () -> {
            tripService.updateTrip(100L, request);
        });

        assertEquals("You cannot reduce the trip capacity below the current number of travelers (4).", ex.getMessage());
    }
}
