package com.restaurante.features.categoria;

import com.restaurante.domain.dtos.CategoriaRequest;
import com.restaurante.domain.dtos.CategoriaResponse;
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
public class CategoriaGraphQLController {

    private final CategoriaService categoriaService;

    public CategoriaGraphQLController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<CategoriaResponse> obtenerCategorias() {
        return categoriaService.findAll();
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public CategoriaResponse obtenerCategoriaPorId(@Argument Long id) {
        return categoriaService.findById(id);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public CategoriaResponse crearCategoria(@Argument @Valid CategoriaRequest input) {
        return categoriaService.create(input);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public CategoriaResponse actualizarCategoria(@Argument Long id, @Argument @Valid CategoriaRequest input) {
        return categoriaService.update(id, input);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public Boolean eliminarCategoria(@Argument Long id) {
        categoriaService.delete(id);
        return true;
    }
}
