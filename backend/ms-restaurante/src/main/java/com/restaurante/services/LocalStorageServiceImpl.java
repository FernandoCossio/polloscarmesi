package com.restaurante.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements ImageStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No se puede guardar un archivo vacío");
        }

        // Crear directorio si no existe
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generar nombre de archivo único
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        Path targetPath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath);

        // Retornamos el path relativo esperado por la aplicación/frontend
        return "uploads/" + fileName;
    }

    @Override
    public void delete(String fileUrl) throws IOException {
        if (fileUrl == null || !fileUrl.startsWith("uploads/")) {
            return;
        }

        String fileName = fileUrl.replaceFirst("^uploads/", "");
        Path filePath = Paths.get(uploadDir).resolve(fileName);

        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
    }
}
