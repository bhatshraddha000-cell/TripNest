package com.tripnest.tripnest.service;

import java.util.List;
import java.util.Optional;

import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.tripnest.tripnest.dto.DocumentResponse;
import com.tripnest.tripnest.dto.UserProfileResponse;
import com.tripnest.tripnest.model.CustomUserDetails;
import com.tripnest.tripnest.model.Document;
import com.tripnest.tripnest.model.Trip;
import com.tripnest.tripnest.model.TripMember;
import com.tripnest.tripnest.model.TripMemberRole;
import com.tripnest.tripnest.model.User;
import com.tripnest.tripnest.repository.DocumentRepository;
import com.tripnest.tripnest.repository.TripMemberRepository;
import com.tripnest.tripnest.repository.TripRepository;
import com.tripnest.tripnest.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private DocumentResponse mapToResponse(Document doc) {
        UserProfileResponse uploadedByProfile = UserProfileResponse.builder()
                .userId(doc.getUploadedBy().getId())
                .name(doc.getUploadedBy().getFullName())
                .fullName(doc.getUploadedBy().getFullName())
                .email(doc.getUploadedBy().getEmail())
                .profileImage(doc.getUploadedBy().getProfileImage())
                .build();

        return DocumentResponse.builder()
                .id(doc.getId())
                .tripId(doc.getTrip().getId())
                .uploadedBy(uploadedByProfile)
                .fileName(doc.getFileName())
                .fileUrl(doc.getFileUrl())
                .documentType(doc.getDocumentType())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }

    @Transactional
    public DocumentResponse uploadDocument(Long tripId, MultipartFile file, String documentType) {
        User user = getAuthenticatedUser();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        // Verify member of trip
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            if (!trip.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Only trip members can upload documents");
            }
        }

        // Validate format
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Invalid file name");
        }
        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".pdf") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
            throw new IllegalArgumentException("Only PDF, JPG, JPEG, and PNG files are allowed");
        }

        // Store file
        String generatedName = documentStorageService.storeDocument(file);
        String fileUrl = "/api/documents/download/" + generatedName;

        Document doc = Document.builder()
                .trip(trip)
                .uploadedBy(user)
                .fileName(originalFilename)
                .fileUrl(fileUrl)
                .documentType(documentType)
                .build();

        Document saved = documentRepository.save(doc);

        // Notify other members
        List<TripMember> members = tripMemberRepository.findByTripId(tripId);
        String msg = user.getFullName() + " uploaded " + originalFilename + ".";
        for (TripMember m : members) {
            if (!m.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(m.getUser(), "Document Uploaded", msg, "DOCUMENT_UPLOADED");
            }
        }

        activityLogService.logActivity(user, "TRIP", tripId, "DOCUMENT_UPLOADED", "Document Uploaded", "Uploaded document \"" + originalFilename + "\"");

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(Long tripId) {
        User user = getAuthenticatedUser();
        
        // Verify member of trip
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, user.getId())) {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new IllegalArgumentException("Trip not found"));
            if (!trip.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Access denied to documents");
            }
        }

        List<Document> documents = documentRepository.findByTripIdOrderByUploadedAtDesc(tripId);
        return documents.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public Resource downloadDocument(String filename, List<String> outFileName) {
        User user = getAuthenticatedUser();
        
        // Find document by fileUrl containing the filename
        String lookupUrl = "/api/documents/download/" + filename;
        // In java streams or repository search
        List<Document> docs = documentRepository.findAll();
        Document doc = docs.stream()
                .filter(d -> d.getFileUrl().equals(lookupUrl))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Verify member of trip
        if (!tripMemberRepository.existsByTripIdAndUserId(doc.getTrip().getId(), user.getId())) {
            if (!doc.getTrip().getUser().getId().equals(user.getId())) {
                throw new SecurityException("Access denied to download this document");
            }
        }

        outFileName.add(doc.getFileName());
        return documentStorageService.loadDocument(filename);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        User user = getAuthenticatedUser();
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        Trip trip = doc.getTrip();
        TripMember member = tripMemberRepository.findByTripIdAndUserId(trip.getId(), user.getId())
                .orElseThrow(() -> new SecurityException("You are not a member of this trip"));

        // Only uploader or GROUP_ADMIN can delete
        boolean isUploader = doc.getUploadedBy().getId().equals(user.getId());
        boolean isGroupAdmin = member.getTripRole() == TripMemberRole.GROUP_ADMIN;
        if (!isUploader && !isGroupAdmin) {
            throw new SecurityException("Only uploader or Group Admin can delete this document");
        }

        // Extract filename from fileUrl
        String fileUrl = doc.getFileUrl();
        String filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

        documentStorageService.deleteDocumentFile(filename);
        documentRepository.delete(doc);

        activityLogService.logActivity(user, "TRIP", trip.getId(), "DOCUMENT_DELETED", "Document Deleted", "Deleted document \"" + doc.getFileName() + "\"");
    }
}
