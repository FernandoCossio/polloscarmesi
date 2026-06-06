package com.restaurante.features.productos;

import com.restaurante.domain.dtos.ProductoRequest;
import com.restaurante.domain.dtos.ProductoResponse;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Controller
@Validated
public class ProductoGraphQLController {

    private final ProductoService productoService;

    public ProductoGraphQLController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<ProductoResponse> obtenerMenu(@Argument Long categoriaId) {
        return productoService.findAll(categoriaId);
    }

    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public ProductoResponse obtenerProducto(@Argument Long id) {
        return productoService.findById(id);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public ProductoResponse crearProducto(@Argument @Valid ProductoRequest input) {
        return productoService.create(input);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public ProductoResponse actualizarProducto(@Argument Long id, @Argument @Valid ProductoRequest input) {
        return productoService.update(id, input);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public ProductoResponse actualizarDisponibilidadProducto(@Argument Long id, @Argument Boolean disponible) {
        if (disponible == null) {
            throw new IllegalArgumentException("El campo 'disponible' es obligatorio");
        }
        return productoService.updateAvailability(id, disponible);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public ProductoResponse subirImagenProducto(@Argument Long id, @Argument MultipartFile file) throws IOException {
        return productoService.uploadImage(id, file);
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('ADMINISTRADOR')")
    public Boolean eliminarProducto(@Argument Long id) {
        productoService.delete(id);
        return true;
    }
}
