package com.restaurante.services;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface ImageStorageService {
    /**
     * Guarda el archivo y retorna la URL relativa o key del archivo guardado (ej: "uploads/filename.jpg").
     */
    String store(MultipartFile file) throws IOException;

    /**
     * Elimina el archivo por su URL relativa.
     */
    void delete(String fileUrl) throws IOException;
}
