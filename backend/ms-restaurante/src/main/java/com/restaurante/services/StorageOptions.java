package com.restaurante.services;

public record StorageOptions(
        String directoryPrefix,
        String bucketName
) {
    public StorageOptions(String directoryPrefix) {
        this(directoryPrefix, null);
    }
}
