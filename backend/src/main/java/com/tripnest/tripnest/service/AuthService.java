package com.tripnest.tripnest.service;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tripnest.tripnest.dto.AuthResponse;
import com.tripnest.tripnest.dto.LoginRequest;
import com.tripnest.tripnest.dto.RegisterRequest;
import com.tripnest.tripnest.exception.DuplicateEmailException;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.RoleRepository;
import com.tripnest.tripnest.repository.UserRepository;
import com.tripnest.tripnest.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException(normalizedEmail);
        }

        Role travelerRole = roleRepository.findByName(RoleName.ROLE_TRAVELER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(RoleName.ROLE_TRAVELER)
                        .build()));

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(Set.of(travelerRole))
                .build();

        User savedUser = userRepository.save(user);

        return AuthResponse.builder()
                .token(null)
                .userId(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .roles(savedUser.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .message("Registration successful")
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        return AuthResponse.builder()
                .token(jwtService.generateToken(userDetails))
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .message("Login successful")
                .build();
    }
}
