package com.tripnest.tripnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tripnest.tripnest.dto.DeleteAccountRequest;
import com.tripnest.tripnest.dto.UpdateProfileRequest;
import com.tripnest.tripnest.dto.UserProfileResponse;
import com.tripnest.tripnest.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateUserProfile(request));
    }

    @PostMapping("/me/photo")
    public ResponseEntity<UserProfileResponse> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadProfilePhoto(file));
    }

    @DeleteMapping("/me/photo")
    public ResponseEntity<UserProfileResponse> removeProfilePhoto() {
        return ResponseEntity.ok(userService.removeProfilePhoto());
    }

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        userService.deleteCurrentUserAccount(request);
        return ResponseEntity.ok(Map.of("message", "Your TripNest account has been deleted."));
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserProfileResponse>> searchUsers(@RequestParam("query") String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }
}

