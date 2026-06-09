package com.restaurante.features.configuracion;

import com.restaurante.domain.dtos.ConfiguracionRequest;
import com.restaurante.domain.dtos.ConfiguracionResponse;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

@Controller
@Validated
public class ConfiguracionGraphQLController {

    private final ConfiguracionService configuracionService;

    public ConfiguracionGraphQLController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @QueryMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ConfiguracionResponse obtenerConfiguracion() {
        return configuracionService.getConfiguracion();
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ConfiguracionResponse actualizarConfiguracion(@Argument @Valid ConfiguracionRequest input) {
        return configuracionService.updateConfiguracion(input);
    }
}
