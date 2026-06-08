package com.restaurante.features.pago;

import com.restaurante.domain.dtos.PagoRequest;
import com.restaurante.domain.dtos.PagoResponse;
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
public class PagoGraphQLController {

    private final PagoService pagoService;

    public PagoGraphQLController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public PagoResponse obtenerPago(@Argument Long id) {
        return pagoService.findById(id);
    }

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO')")
    public List<PagoResponse> obtenerPagos() {
        return pagoService.findAll();
    }

    @MutationMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRADOR', 'ROLE_CAJERO', 'ROLE_CLIENTE')")
    public PagoResponse registrarPago(@Argument @Valid PagoRequest input) {
        return pagoService.create(input);
    }
}
