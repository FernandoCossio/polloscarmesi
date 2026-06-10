package com.auth.features.usuario;

import com.auth.common.response.ApiResponse;
import com.auth.domain.dtos.usuario.AdminActualizarUsuarioDto;
import com.auth.domain.dtos.usuario.AdminCambiarEstadoUsuarioDto;
import com.auth.domain.dtos.usuario.AdminCrearUsuarioDto;
import com.auth.domain.dtos.usuario.AdminUsuarioResponseDto;
import com.auth.domain.enums.RolNombre;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @GetMapping("/personal")
    public ResponseEntity<ApiResponse<List<AdminUsuarioResponseDto>>> listarPersonal(
            @RequestParam(value = "rol", required = false) RolNombre rol
    ) {
        List<AdminUsuarioResponseDto> result = usuarioService.listarPersonal(rol);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @GetMapping("/{uuid}")
    public ResponseEntity<ApiResponse<AdminUsuarioResponseDto>> obtenerPorUuid(@PathVariable UUID uuid) {
        AdminUsuarioResponseDto result = usuarioService.obtenerPorUuid(uuid);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @PostMapping("/personal")
    public ResponseEntity<ApiResponse<AdminUsuarioResponseDto>> crearPersonal(@Valid @RequestBody AdminCrearUsuarioDto request) {
        AdminUsuarioResponseDto created = usuarioService.crearPersonal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Usuario creado correctamente."));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @PutMapping("/personal/{uuid}")
    public ResponseEntity<ApiResponse<AdminUsuarioResponseDto>> actualizarPersonal(
            @PathVariable UUID uuid,
            @Valid @RequestBody AdminActualizarUsuarioDto request
    ) {
        AdminUsuarioResponseDto updated = usuarioService.actualizarPersonal(uuid, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Usuario actualizado correctamente."));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    @PatchMapping("/personal/{uuid}/estado")
    public ResponseEntity<ApiResponse<AdminUsuarioResponseDto>> cambiarEstado(
            @PathVariable UUID uuid,
            @Valid @RequestBody AdminCambiarEstadoUsuarioDto request
    ) {
        AdminUsuarioResponseDto updated = usuarioService.cambiarEstado(uuid, Boolean.TRUE.equals(request.activo()));
        return ResponseEntity.ok(ApiResponse.success(updated, "Estado del usuario actualizado correctamente."));
    }
}
