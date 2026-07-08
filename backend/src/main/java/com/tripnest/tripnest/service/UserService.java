package com.tripnest.tripnest.service;

import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.UserProfileResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.User;

@Service
public class UserService {

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (!(principal instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("Authenticated user not found");
        }

        User user = userDetails.getUser();
        return UserProfileResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .build();
    }
}
