package com.restaurante.features.pedido;

import com.restaurante.domain.dtos.PedidoRequest;
import com.restaurante.domain.dtos.PedidoResponse;
import com.restaurante.domain.enums.EstadoPedido;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Controller
@Validated
public class PedidoGraphQLController {

    private final PedidoService pedidoService;

    public PedidoGraphQLController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public PedidoResponse obtenerPedido(@Argument Long id) {
        return pedidoService.findById(id);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<PedidoResponse> obtenerPedidosPorFecha(@Argument String fecha) {
        return pedidoService.findByFecha(fecha);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<PedidoResponse> obtenerPedidosHistoricos(@Argument Long clienteId, @Argument Integer limit) {
        return pedidoService.findHistoricos(clienteId, limit);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<PedidoResponse> obtenerPedidosActivos() {
        return pedidoService.findActivePedidos();
    }

    @MutationMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public PedidoResponse crearPedidoPresencial(@Argument @Valid PedidoRequest input) {
        return pedidoService.create(input);
    }

    @MutationMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public PedidoResponse cancelarPedido(@Argument Long id, @Argument String motivo) {
        return pedidoService.cancelar(id, motivo);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public PedidoResponse sincronizarEstadoDelivery(@Argument Long pedidoId, @Argument EstadoPedido estado) {
        return pedidoService.sincronizarEstadoDelivery(pedidoId, estado);
    }

    @MutationMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_COCINA')")
    public PedidoResponse actualizarEstadoCocina(@Argument Long id, @Argument EstadoPedido estado) {
        return pedidoService.actualizarEstadoCocina(id, estado);
    }
}
