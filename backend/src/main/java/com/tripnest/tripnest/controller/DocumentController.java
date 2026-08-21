package com.tripnest.tripnest.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tripnest.tripnest.dto.DocumentResponse;
import com.tripnest.tripnest.service.DocumentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/trips/{tripId}/documents")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @PathVariable Long tripId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {
        return ResponseEntity.ok(documentService.uploadDocument(tripId, file, documentType));
    }

    @GetMapping("/trips/{tripId}/documents")
    public ResponseEntity<List<DocumentResponse>> listDocuments(@PathVariable Long tripId) {
        return ResponseEntity.ok(documentService.listDocuments(tripId));
    }

    @GetMapping("/documents/download/{filename:.+}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String filename) {
        List<String> outFileName = new ArrayList<>();
        Resource resource = documentService.downloadDocument(filename, outFileName);
        
        String originalName = outFileName.isEmpty() ? filename : outFileName.get(0);
        String contentType = "application/octet-stream";
        String lower = originalName.toLowerCase();
        
        if (lower.endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (lower.endsWith(".png")) {
            contentType = "image/png";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + originalName + "\"")
                .body(resource);
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}
