package com.tripnest.tripnest.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripInvitationResponse {
    private Long id;
    private Long tripId;
    private String tripTitle;
    private String senderName;
    private String status;
    private LocalDateTime createdAt;
}
