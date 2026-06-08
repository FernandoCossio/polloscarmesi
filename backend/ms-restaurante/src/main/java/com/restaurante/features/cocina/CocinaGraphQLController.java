package com.restaurante.features.cocina;

import com.restaurante.domain.dtos.PedidoResponse;
import com.restaurante.domain.enums.EstadoPedido;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Controller
@Validated
public class CocinaGraphQLController {

    private final CocinaService cocinaService;

    public CocinaGraphQLController(CocinaService cocinaService) {
        this.cocinaService = cocinaService;
    }

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_COCINA')")
    public List<PedidoResponse> obtenerColaCocina() {
        return cocinaService.obtenerColaCocina();
    }

    @MutationMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_COCINA')")
    public PedidoResponse actualizarEstadoPedidoCocina(@Argument Long id, @Argument EstadoPedido estado) {
        return cocinaService.actualizarEstadoCocina(id, estado);
    }
}
