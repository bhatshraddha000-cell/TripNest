package com.tripnest.tripnest.service.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalStorageServiceImpl implements StorageService {

    private final Path profileUploadLocation = Paths.get("uploads/profiles").toAbsolutePath().normalize();
    private final Path documentUploadLocation = Paths.get("uploads/documents").toAbsolutePath().normalize();

    public LocalStorageServiceImpl() {
        try {
            Files.createDirectories(profileUploadLocation);
            Files.createDirectories(documentUploadLocation);
            log.info("Initialized local file storage directories at: {} and {}", profileUploadLocation, documentUploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create local upload directories", e);
        }
    }

    @Override
    public String storeProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "avatar.png");
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String newFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = profileUploadLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/api/uploads/profiles/" + newFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store profile photo " + newFilename, e);
        }
    }

    @Override
    public Resource loadProfilePhoto(String filename) {
        try {
            String cleanName = filename.contains("/") ? filename.substring(filename.lastIndexOf('/') + 1) : filename;
            Path filePath = profileUploadLocation.resolve(cleanName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Profile photo not found " + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("Profile photo not found " + filename, e);
        }
    }

    @Override
    public void deleteProfilePhoto(String imagePath) {
        if (imagePath == null) return;
        String filename = imagePath.contains("/") ? imagePath.substring(imagePath.lastIndexOf('/') + 1) : imagePath;
        try {
            Path filePath = profileUploadLocation.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }

    @Override
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
            Path targetLocation = documentUploadLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return newFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store document " + newFilename, e);
        }
    }

    @Override
    public Resource loadDocument(String filename) {
        try {
            String cleanName = filename.contains("/") ? filename.substring(filename.lastIndexOf('/') + 1) : filename;
            Path filePath = documentUploadLocation.resolve(cleanName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Document file not found " + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("Document file not found " + filename, e);
        }
    }

    @Override
    public void deleteDocumentFile(String filename) {
        if (filename == null) return;
        String cleanName = filename.contains("/") ? filename.substring(filename.lastIndexOf('/') + 1) : filename;
        try {
            Path filePath = documentUploadLocation.resolve(cleanName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }
}
