package com.restaurante.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class InternalServiceAuthService {

    private static final Logger logger = LoggerFactory.getLogger(InternalServiceAuthService.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final RestClient restClient;
    private final String authBaseUrl;
    private final String clientId;
    private final String clientSecret;
    private final long cacheSkewSeconds;

    private String cachedAccessToken;
    private Instant cachedExpiresAt;

    public InternalServiceAuthService(
            RestClient.Builder restClientBuilder,
            @Value("${app.internal-auth.base-url}") String authBaseUrl,
            @Value("${app.internal-auth.client-id}") String clientId,
            @Value("${app.internal-auth.client-secret:}") String clientSecret,
            @Value("${app.internal-auth.cache-skew-seconds:60}") long cacheSkewSeconds
    ) {
        this.restClient = restClientBuilder.build();
        this.authBaseUrl = authBaseUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.cacheSkewSeconds = cacheSkewSeconds;
    }

    public synchronized String getAccessToken() {
        if (cachedAccessToken != null
                && cachedExpiresAt != null
                && Instant.now().isBefore(cachedExpiresAt.minusSeconds(cacheSkewSeconds))) {
            return cachedAccessToken;
        }

        if (clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException(
                    "La credencial interna no esta configurada en app.internal-auth.client-secret"
            );
        }

        JsonNode responseBody = restClient.post()
                .uri(authBaseUrl + "/auth/service-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ServiceTokenRequest(clientId, clientSecret))
                .retrieve()
                .body(JsonNode.class);

        String accessToken = extractAccessToken(responseBody);
        cachedAccessToken = accessToken;
        cachedExpiresAt = extractExpiration(accessToken);

        logger.debug("Token tecnico actualizado para {}", clientId);
        return accessToken;
    }

    public String getAuthorizationHeader() {
        return "Bearer " + getAccessToken();
    }

    private String extractAccessToken(JsonNode responseBody) {
        JsonNode accessTokenNode = responseBody != null
                ? responseBody.path("data").path("accessToken")
                : null;

        if (accessTokenNode == null || accessTokenNode.isMissingNode() || accessTokenNode.asText().isBlank()) {
            throw new IllegalStateException("Auth no devolvio un accessToken tecnico valido");
        }

        return accessTokenNode.asText();
    }

    private Instant extractExpiration(String accessToken) {
        try {
            String[] parts = accessToken.split("\\.");
            if (parts.length != 3) {
                return Instant.now();
            }

            String payloadJson = new String(
                    Base64.getUrlDecoder().decode(padBase64(parts[1])),
                    StandardCharsets.UTF_8
            );
            JsonNode payload = OBJECT_MAPPER.readTree(payloadJson);
            long exp = payload.path("exp").asLong(0L);

            if (exp > 0L) {
                return Instant.ofEpochSecond(exp);
            }
        } catch (Exception error) {
            logger.warn("No se pudo leer la expiracion del token tecnico: {}", error.getMessage());
        }

        return Instant.now();
    }

    private String padBase64(String value) {
        int remainder = value.length() % 4;
        if (remainder == 0) {
            return value;
        }
        return value + "=".repeat(4 - remainder);
    }

    private record ServiceTokenRequest(
            String clientId,
            String clientSecret
    ) {
    }
}
