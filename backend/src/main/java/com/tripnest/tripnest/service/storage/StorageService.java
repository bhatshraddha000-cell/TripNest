package com.tripnest.tripnest.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String storeProfilePhoto(MultipartFile file);
    Resource loadProfilePhoto(String filenameOrUrl);
    void deleteProfilePhoto(String imagePathOrUrl);

    String storeDocument(MultipartFile file);
    Resource loadDocument(String filenameOrUrl);
    void deleteDocumentFile(String filenameOrUrl);
}
