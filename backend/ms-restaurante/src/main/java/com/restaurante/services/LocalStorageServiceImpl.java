package com.restaurante.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(LocalStorageServiceImpl.class);

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file) throws IOException {
        return store(file, new StorageOptions("uploads"));
    }

    @Override
    public String store(MultipartFile file, String customKey) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No se puede guardar un archivo vacío");
        }

        Path targetPath = Paths.get(uploadDir).resolve(customKey);
        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        logger.info("Archivo guardado localmente con key personalizada: {}", targetPath);
        return customKey;
    }

    @Override
    public String generatePresignedUrl(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            return null;
        }
        return "/api/storage/" + s3Key;
    }

    @Override
    public String store(MultipartFile file, StorageOptions options) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No se puede guardar un archivo vacío");
        }

        String directoryPrefix = options.directoryPrefix() != null ? options.directoryPrefix() : "uploads";

        String datePath = DateTimeFormatter.ofPattern("yyyy/MM")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;

        String relativePath = directoryPrefix + "/" + datePath + "/" + fileName;
        Path targetPath = Paths.get(uploadDir).resolve(directoryPrefix).resolve(datePath).resolve(fileName);

        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath);

        logger.info("Archivo guardado localmente: {}", targetPath);
        return relativePath;
    }

    @Override
    public void delete(String fileUrl) throws IOException {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        Path filePath = Paths.get(uploadDir).resolve(fileUrl);

        if (Files.exists(filePath)) {
            Files.delete(filePath);
            logger.info("Archivo eliminado localmente: {}", filePath);
        }
    }
}
