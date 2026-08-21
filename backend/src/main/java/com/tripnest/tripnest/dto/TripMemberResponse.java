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
public class TripMemberResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String profileImage;
    private String tripRole;
    private LocalDateTime joinedAt;
}
