package com.tripnest.tripnest.service.storage;

import java.net.URI;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "cloudinary")
@Slf4j
public class CloudinaryStorageServiceImpl implements StorageService {

    private final Cloudinary cloudinary;

    public CloudinaryStorageServiceImpl(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {
        
        if (cloudName == null || cloudName.isBlank() || apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            log.warn("Cloudinary configuration missing or incomplete! Cloudinary storage operations will fail until valid credentials are provided.");
        }
        
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        log.info("Initialized Cloudinary storage service for cloud: {}", cloudName);
    }

    @Override
    public String storeProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "tripnest/profiles",
                    "resource_type", "auto"
            ));
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Successfully uploaded profile photo to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Error uploading profile photo to Cloudinary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload profile photo to Cloudinary", e);
        }
    }

    @Override
    public Resource loadProfilePhoto(String filenameOrUrl) {
        try {
            if (filenameOrUrl == null || filenameOrUrl.isBlank()) {
                throw new IllegalArgumentException("Invalid profile photo URL");
            }
            URI uri = filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://") 
                    ? new URI(filenameOrUrl) 
                    : new URI("https://" + filenameOrUrl);
            Resource resource = new UrlResource(uri);
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Profile photo resource not readable: " + filenameOrUrl);
        } catch (Exception e) {
            log.error("Error loading profile photo resource: {}", e.getMessage());
            throw new RuntimeException("Could not load profile photo from Cloudinary", e);
        }
    }

    @Override
    public void deleteProfilePhoto(String imagePathOrUrl) {
        if (imagePathOrUrl == null || imagePathOrUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(imagePathOrUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Deleted profile photo from Cloudinary: {}", publicId);
            }
        } catch (Exception e) {
            log.warn("Failed to delete profile photo from Cloudinary: {}", e.getMessage());
        }
    }

    @Override
    public String storeDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "tripnest/documents",
                    "resource_type", "auto"
            ));
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Successfully uploaded document to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Error uploading document to Cloudinary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload document to Cloudinary", e);
        }
    }

    @Override
    public Resource loadDocument(String filenameOrUrl) {
        try {
            if (filenameOrUrl == null || filenameOrUrl.isBlank()) {
                throw new IllegalArgumentException("Invalid document URL");
            }
            URI uri = filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://") 
                    ? new URI(filenameOrUrl) 
                    : new URI("https://" + filenameOrUrl);
            Resource resource = new UrlResource(uri);
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Document resource not readable: " + filenameOrUrl);
        } catch (Exception e) {
            log.error("Error loading document resource: {}", e.getMessage());
            throw new RuntimeException("Could not load document from Cloudinary", e);
        }
    }

    @Override
    public void deleteDocumentFile(String filenameOrUrl) {
        if (filenameOrUrl == null || filenameOrUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(filenameOrUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Deleted document from Cloudinary: {}", publicId);
            }
        } catch (Exception e) {
            log.warn("Failed to delete document from Cloudinary: {}", e.getMessage());
        }
    }

    private String extractPublicId(String url) {
        if (url == null || !url.contains("/upload/")) {
            return url;
        }
        try {
            String afterUpload = url.substring(url.indexOf("/upload/") + 8);
            if (afterUpload.startsWith("v")) {
                int firstSlash = afterUpload.indexOf('/');
                if (firstSlash != -1) {
                    afterUpload = afterUpload.substring(firstSlash + 1);
                }
            }
            int lastDot = afterUpload.lastIndexOf('.');
            if (lastDot != -1) {
                afterUpload = afterUpload.substring(0, lastDot);
            }
            return afterUpload;
        } catch (Exception e) {
            return null;
        }
    }
}
