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
public class TripChatMessageResponse {

    private Long id;
    private Long tripId;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String senderProfileImage;
    private String message;
    private LocalDateTime createdAt;
}
