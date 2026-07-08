package com.tripnest.tripnest.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tripnest.tripnest.model.PasswordResetToken;
import com.tripnest.tripnest.model.User;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUser(User user);

    void deleteByUser(User user);
}
