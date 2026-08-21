package com.tripnnest.tripnest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tripnest.tripnest.dto.CreateChatMessageRequest;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripChatMessage;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.TripChatMessageRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.service.TripChatService;

public class TripChatTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private TripChatMessageRepository tripChatMessageRepository;

    @InjectMocks
    private TripChatService tripChatService;

    private User user1;
    private User user2;
    private Trip tripA;
    private Trip tripB;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);

        user1 = User.builder().id(1L).fullName("Rahul Sharma").email("rahul@example.com").build();
        user2 = User.builder().id(2L).fullName("Priya Patel").email("priya@example.com").build();

        tripA = Trip.builder().id(101L).title("Tokyo Trip").destination("Tokyo").user(user1).build();
        tripB = Trip.builder().id(102L).title("Karnataka Tour").destination("Karnataka").user(user2).build();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        when(userDetails.getUsername()).thenReturn("rahul@example.com");

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("rahul@example.com")).thenReturn(Optional.of(user1));
        when(userRepository.findByEmail("priya@example.com")).thenReturn(Optional.of(user2));
        when(tripRepository.findById(101L)).thenReturn(Optional.of(tripA));
        when(tripRepository.findById(102L)).thenReturn(Optional.of(tripB));
    }

    @Test
    public void testGetTripMessages_AsMember_Success() {
        when(tripMemberRepository.existsByTripIdAndUserId(101L, 1L)).thenReturn(true);

        TripChatMessage msg = TripChatMessage.builder()
                .id(1L)
                .trip(tripA)
                .sender(user1)
                .message("Has everyone booked the hotel?")
                .build();

        when(tripChatMessageRepository.findByTripIdOrderByCreatedAtAsc(101L)).thenReturn(List.of(msg));

        var messages = tripChatService.getTripMessages(101L);

        assertNotNull(messages);
        assertEquals(1, messages.size());
        assertEquals("Has everyone booked the hotel?", messages.get(0).getMessage());
        assertEquals("Rahul Sharma", messages.get(0).getSenderName());
    }

    @Test
    public void testGetTripMessages_AsNonMember_ThrowsSecurityException() {
        when(tripMemberRepository.existsByTripIdAndUserId(102L, 1L)).thenReturn(false);

        SecurityException ex = assertThrows(SecurityException.class, () -> {
            tripChatService.getTripMessages(102L);
        });

        assertEquals("You are not a member of this trip", ex.getMessage());
    }

    @Test
    public void testSendMessage_AsMember_Success() {
        when(tripMemberRepository.existsByTripIdAndUserId(101L, 1L)).thenReturn(true);

        when(tripChatMessageRepository.save(any(TripChatMessage.class))).thenAnswer(inv -> {
            TripChatMessage m = inv.getArgument(0);
            m.setId(10L);
            return m;
        });

        CreateChatMessageRequest request = CreateChatMessageRequest.builder().message("Yes, I'll book it today.").build();
        var resp = tripChatService.sendMessage(101L, request);

        assertNotNull(resp);
        assertEquals("Yes, I'll book it today.", resp.getMessage());
        assertEquals(101L, resp.getTripId());
        assertEquals("Rahul Sharma", resp.getSenderName());
    }

    @Test
    public void testSendMessage_AsNonMember_ThrowsSecurityException() {
        when(tripMemberRepository.existsByTripIdAndUserId(102L, 1L)).thenReturn(false);

        CreateChatMessageRequest request = CreateChatMessageRequest.builder().message("Hello Trip B").build();

        SecurityException ex = assertThrows(SecurityException.class, () -> {
            tripChatService.sendMessage(102L, request);
        });

        assertEquals("You are not a member of this trip", ex.getMessage());
    }

    @Test
    public void testTripMessageIsolation() {
        when(tripMemberRepository.existsByTripIdAndUserId(101L, 1L)).thenReturn(true);
        when(tripMemberRepository.existsByTripIdAndUserId(102L, 2L)).thenReturn(true);

        TripChatMessage msgA = TripChatMessage.builder().id(1L).trip(tripA).sender(user1).message("Tokyo Msg").build();
        TripChatMessage msgB = TripChatMessage.builder().id(2L).trip(tripB).sender(user2).message("Karnataka Msg").build();

        when(tripChatMessageRepository.findByTripIdOrderByCreatedAtAsc(101L)).thenReturn(List.of(msgA));
        when(tripChatMessageRepository.findByTripIdOrderByCreatedAtAsc(102L)).thenReturn(List.of(msgB));

        var msgsA = tripChatService.getTripMessages(101L);
        assertEquals(1, msgsA.size());
        assertEquals("Tokyo Msg", msgsA.get(0).getMessage());
    }
}
