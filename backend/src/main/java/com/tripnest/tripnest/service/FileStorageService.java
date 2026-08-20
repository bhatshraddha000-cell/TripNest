package com.tripnest.tripnest.service;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.tripnest.tripnest.service.storage.StorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final StorageService storageService;

    public String storeProfilePhoto(MultipartFile file) {
        return storageService.storeProfilePhoto(file);
    }

    public Resource loadProfilePhoto(String filename) {
        return storageService.loadProfilePhoto(filename);
    }

    public void deleteProfilePhoto(String imagePath) {
        storageService.deleteProfilePhoto(imagePath);
    }
}
