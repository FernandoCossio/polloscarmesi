package com.restaurante.services;

import com.restaurante.config.S3Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Service
public class S3StorageServiceImpl implements StorageService {

    private static final Logger logger = LoggerFactory.getLogger(S3StorageServiceImpl.class);

    private final S3Client s3Client;
    private final S3Properties s3Properties;
    private final S3Presigner s3Presigner;

    public S3StorageServiceImpl(S3Client s3Client, S3Properties s3Properties, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Properties = s3Properties;
        this.s3Presigner = s3Presigner;
    }

    @Override
    public String store(MultipartFile file) throws IOException {
        return store(file, new StorageOptions("uploads"));
    }

    @Override
    public String store(MultipartFile file, String customKey) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No se puede guardar un archivo vacío");
        }

        String bucket = s3Properties.getBucket();

        logger.info("Subiendo archivo a S3 con key personalizada: bucket={}, key={}", bucket, customKey);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(customKey)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return generateFileUrl(bucket, customKey);
    }

    @Override
    public String generatePresignedUrl(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            return null;
        }

        String bucket = s3Properties.getBucket();

        software.amazon.awssdk.services.s3.model.GetObjectRequest getObjectRequest = software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();

        software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest presignRequest = software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest.builder()
                .signatureDuration(java.time.Duration.ofMinutes(15))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public String store(MultipartFile file, StorageOptions options) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No se puede guardar un archivo vacío");
        }

        String bucket = options.bucketName() != null ? options.bucketName() : s3Properties.getBucket();
        String directoryPrefix = options.directoryPrefix() != null ? options.directoryPrefix() : "uploads";

        String s3Key = generateS3Key(file, directoryPrefix);

        logger.info("Subiendo archivo a S3: bucket={}, key={}", bucket, s3Key);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return generateFileUrl(bucket, s3Key);
    }

    @Override
    public void delete(String fileUrl) throws IOException {
        if (fileUrl == null || fileUrl.isBlank()) {
            logger.warn("Intento de eliminar archivo con URL nula o vacía");
            return;
        }

        String bucket = extractBucketFromUrl(fileUrl);
        String s3Key = extractS3KeyFromUrl(fileUrl, bucket);

        if (s3Key == null) {
            logger.warn("No se pudo extraer el key de S3 desde la URL: {}", fileUrl);
            return;
        }

        logger.info("Eliminando archivo de S3: bucket={}, key={}", bucket, s3Key);

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();

        s3Client.deleteObject(deleteRequest);
    }

    private String generateS3Key(MultipartFile file, String directoryPrefix) {
        String datePath = DateTimeFormatter.ofPattern("yyyy/MM")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String secureFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;

        return directoryPrefix + "/" + datePath + "/" + secureFileName;
    }

    private String generateFileUrl(String bucket, String s3Key) {
        if (s3Properties.getEndpoint() != null && !s3Properties.getEndpoint().isBlank()) {
            return s3Properties.getEndpoint() + "/" + bucket + "/" + s3Key;
        }
        return String.format(s3Properties.getUrlPattern(), bucket, s3Properties.getRegion(), s3Key);
    }

    private String extractBucketFromUrl(String fileUrl) {
        if (s3Properties.getEndpoint() != null && !s3Properties.getEndpoint().isBlank()) {
            String endpoint = s3Properties.getEndpoint() + "/";
            if (fileUrl.startsWith(endpoint)) {
                String afterEndpoint = fileUrl.substring(endpoint.length());
                int slashIndex = afterEndpoint.indexOf('/');
                if (slashIndex != -1) {
                    return afterEndpoint.substring(0, slashIndex);
                }
            }
        } else {
            String pattern = "https://([^.]+)\\.s3\\.";
            java.util.regex.Pattern regex = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher matcher = regex.matcher(fileUrl);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return s3Properties.getBucket();
    }

    private String extractS3KeyFromUrl(String fileUrl, String bucket) {
        String bucketMarker = "/" + bucket + "/";
        int bucketIndex = fileUrl.indexOf(bucketMarker);
        if (bucketIndex != -1) {
            return fileUrl.substring(bucketIndex + bucketMarker.length());
        }
        return null;
    }
}
