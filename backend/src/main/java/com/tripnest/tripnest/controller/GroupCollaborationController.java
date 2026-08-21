package com.tripnest.tripnest.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tripnest.tripnest.dto.InviteMemberRequest;
import com.tripnest.tripnest.dto.TripInvitationResponse;
import com.tripnest.tripnest.dto.TripMemberResponse;
import com.tripnest.tripnest.service.GroupCollaborationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GroupCollaborationController {

    private final GroupCollaborationService groupCollaborationService;

    @PostMapping("/trips/{tripId}/invite")
    public ResponseEntity<TripInvitationResponse> inviteMember(
            @PathVariable Long tripId,
            @Valid @RequestBody InviteMemberRequest request) {
        return ResponseEntity.ok(groupCollaborationService.inviteMember(tripId, request));
    }

    @GetMapping("/trips/{tripId}/members")
    public ResponseEntity<List<TripMemberResponse>> getTripMembers(@PathVariable Long tripId) {
        return ResponseEntity.ok(groupCollaborationService.getTripMembers(tripId));
    }

    @PostMapping("/invitations/{invitationId}/accept")
    public ResponseEntity<Void> acceptInvitation(@PathVariable Long invitationId) {
        groupCollaborationService.acceptInvitation(invitationId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/invitations/{invitationId}/reject")
    public ResponseEntity<Void> rejectInvitation(@PathVariable Long invitationId) {
        groupCollaborationService.rejectInvitation(invitationId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/trips/{tripId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long tripId, @PathVariable Long userId) {
        groupCollaborationService.removeMember(tripId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations/pending")
    public ResponseEntity<List<TripInvitationResponse>> getPendingInvitations() {
        return ResponseEntity.ok(groupCollaborationService.getPendingInvitations());
    }
}
