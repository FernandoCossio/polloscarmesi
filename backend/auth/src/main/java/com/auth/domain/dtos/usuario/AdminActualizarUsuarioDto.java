package com.auth.domain.dtos.usuario;

import com.auth.domain.enums.RolNombre;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record AdminActualizarUsuarioDto(
        @Email(message = "Formato de email inválido")
        String email,

        String nombreCompleto,

        String telefono,

        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        RolNombre rol
) {
}
