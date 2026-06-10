package com.auth.domain.dtos.auth;

import jakarta.validation.constraints.NotBlank;

public record ServiceTokenRequest(
    @NotBlank(message = "El clientId no puede estar vacío")
    String clientId,

    @NotBlank(message = "El clientSecret no puede estar vacío")
    String clientSecret
) {}
