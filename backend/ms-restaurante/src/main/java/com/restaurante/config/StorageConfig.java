package com.restaurante.config;

import com.restaurante.services.StorageService;
import com.restaurante.services.LocalStorageServiceImpl;
import com.restaurante.services.S3StorageServiceImpl;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class StorageConfig {

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3", matchIfMissing = true)
    public StorageService s3StorageService(S3StorageServiceImpl s3StorageServiceImpl) {
        return s3StorageServiceImpl;
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "local")
    public StorageService localStorageService(LocalStorageServiceImpl localStorageServiceImpl) {
        return localStorageServiceImpl;
    }
}
