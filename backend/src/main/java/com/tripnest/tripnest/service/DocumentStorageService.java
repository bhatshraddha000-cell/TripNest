package com.tripnest.tripnest.service;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.tripnest.tripnest.service.storage.StorageService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentStorageService {

    private final StorageService storageService;

    public String storeDocument(MultipartFile file) {
        return storageService.storeDocument(file);
    }

    public Resource loadDocument(String filename) {
        return storageService.loadDocument(filename);
    }

    public void deleteDocumentFile(String filename) {
        storageService.deleteDocumentFile(filename);
    }
}
