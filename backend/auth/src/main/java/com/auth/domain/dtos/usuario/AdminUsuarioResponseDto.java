package com.auth.domain.dtos.usuario;

import java.util.Set;
import java.util.UUID;

public record AdminUsuarioResponseDto(
        UUID uuid,
        String username,
        String email,
        String nombreCompleto,
        String telefono,
        Boolean activo,
        Set<String> roles
) {
}
