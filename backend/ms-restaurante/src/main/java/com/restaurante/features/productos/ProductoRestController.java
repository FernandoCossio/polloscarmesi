package com.restaurante.features.productos;

import com.restaurante.domain.dtos.ProductoResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/productos")
public class ProductoRestController {

    private final ProductoService productoService;

    public ProductoRestController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @PostMapping("/{id}/imagen")
    @PreAuthorize("hasAuthority('ROLE_ADMINISTRADOR')")
    public ResponseEntity<ProductoResponse> subirImagen(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        ProductoResponse producto = productoService.uploadImage(id, file);
        return ResponseEntity.ok(producto);
    }
}
