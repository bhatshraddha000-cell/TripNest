package com.tripnest.tripnest.dto;

import java.time.LocalDateTime;
import java.util.Set;

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
public class UserProfileResponse {

    private Long userId;
    private String name;
    private String fullName;
    private String email;
    private String profileImage;
    private String role;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private String memberSince;
}
