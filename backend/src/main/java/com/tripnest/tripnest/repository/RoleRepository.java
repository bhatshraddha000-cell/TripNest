package com.tripnest.tripnest.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tripnest.tripnest.model.Role;
import com.tripnest.tripnest.model.RoleName;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);
}
