package com.restaurante.features.configuracion;

import com.restaurante.domain.dtos.ConfiguracionRequest;
import com.restaurante.domain.dtos.ConfiguracionResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/configuracion")
public class ConfiguracionRestController {

    private final ConfiguracionService configuracionService;

    public ConfiguracionRestController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<ConfiguracionResponse> obtenerConfiguracion() {
        return ResponseEntity.ok(configuracionService.getConfiguracion());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<ConfiguracionResponse> actualizarConfiguracion(@Valid @RequestBody ConfiguracionRequest request) {
        return ResponseEntity.ok(configuracionService.updateConfiguracion(request));
    }
}
