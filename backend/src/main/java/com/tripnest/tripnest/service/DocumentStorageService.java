package com.tripnest.tripnest.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentStorageService {

    private final Path uploadLocation = Paths.get("uploads/documents").toAbsolutePath().normalize();

    public DocumentStorageService() {
        try {
            Files.createDirectories(uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create document upload directory", e);
        }
    }

    public String storeDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String newFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.uploadLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return newFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + newFilename, e);
        }
    }

    public Resource loadDocument(String filename) {
        try {
            Path filePath = this.uploadLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found " + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("File not found " + filename, e);
        }
    }

    public void deleteDocumentFile(String filename) {
        try {
            Path filePath = this.uploadLocation.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }
}
