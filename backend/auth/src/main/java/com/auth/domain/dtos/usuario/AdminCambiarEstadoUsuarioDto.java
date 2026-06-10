package com.auth.domain.dtos.usuario;

import jakarta.validation.constraints.NotNull;

public record AdminCambiarEstadoUsuarioDto(
        @NotNull(message = "El campo activo es obligatorio")
        Boolean activo
) {
}
