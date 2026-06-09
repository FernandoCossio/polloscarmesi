package com.restaurante.services;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface ImageStorageService {
    String store(MultipartFile file) throws IOException;
    String store(MultipartFile file, StorageOptions options) throws IOException;
    String store(MultipartFile file, String customKey) throws IOException;
    void delete(String fileUrl) throws IOException;
    String generatePresignedUrl(String s3Key);
}
