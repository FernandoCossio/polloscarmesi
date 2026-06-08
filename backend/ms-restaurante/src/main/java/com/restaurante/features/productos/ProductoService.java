package com.restaurante.features.productos;

import com.restaurante.features.categoria.exceptions.CategoriaNoEncontradaException;
import com.restaurante.features.productos.exceptions.ProductoDuplicadoException;
import com.restaurante.features.productos.exceptions.ProductoNoEncontradoException;
import com.restaurante.domain.dtos.CategoriaResponse;
import com.restaurante.domain.dtos.ProductoRequest;
import com.restaurante.domain.dtos.ProductoResponse;
import com.restaurante.domain.models.Categoria;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.categoria.CategoriaRepository;
import com.restaurante.services.ImageStorageService;
import com.restaurante.services.StorageOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ImageStorageService imageStorageService;

    public ProductoService(ProductoRepository productoRepository,
                           CategoriaRepository categoriaRepository,
                           ImageStorageService imageStorageService) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.imageStorageService = imageStorageService;
    }

    public List<ProductoResponse> findAll(Long categoriaId) {
        List<Producto> productos;
        if (categoriaId != null) {
            productos = productoRepository.findAllByCategoriaId(categoriaId);
        } else {
            productos = productoRepository.findAll();
        }
        return productos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProductoResponse findById(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(ProductoNoEncontradoException::new);
        return mapToResponse(producto);
    }

    @Transactional
    public ProductoResponse create(ProductoRequest request) {
        if (productoRepository.existsByNombre(request.getNombre())) {
            throw new ProductoDuplicadoException();
        }

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(CategoriaNoEncontradaException::new);

        Producto producto = new Producto();
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setCategoria(categoria);
        producto.setDisponible(true);

        Producto saved = productoRepository.save(producto);
        return mapToResponse(saved);
    }

    @Transactional
    public ProductoResponse update(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(ProductoNoEncontradoException::new);

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(CategoriaNoEncontradaException::new);

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setCategoria(categoria);

        Producto updated = productoRepository.save(producto);
        return mapToResponse(updated);
    }

    @Transactional
    public ProductoResponse updateAvailability(Long id, boolean disponible) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(ProductoNoEncontradoException::new);

        producto.setDisponible(disponible);
        Producto updated = productoRepository.save(producto);
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(ProductoNoEncontradoException::new);

        // Soft delete
        producto.setIsDeleted(true);
        productoRepository.save(producto);
    }

    @Transactional
    public ProductoResponse uploadImage(Long id, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen no puede estar vacío");
        }

        Producto producto = productoRepository.findById(id)
                .orElseThrow(ProductoNoEncontradoException::new);

        if (producto.getImagenUrl() != null) {
            try {
                imageStorageService.delete(producto.getImagenUrl());
            } catch (IOException e) {
                log.warn("No se pudo eliminar la imagen anterior del producto ID {}: {}", id, e.getMessage());
            }
        }

        String savedPath = imageStorageService.store(file, new StorageOptions("productos"));
        producto.setImagenUrl(savedPath);

        Producto updated = productoRepository.save(producto);
        return mapToResponse(updated);
    }

    public ProductoResponse mapToResponse(Producto producto) {
        CategoriaResponse catResponse = null;
        if (producto.getCategoria() != null) {
            Categoria cat = producto.getCategoria();
            catResponse = new CategoriaResponse(
                    cat.getId(),
                    cat.getNombre(),
                    cat.getDescripcion(),
                    cat.getIcon()
            );
        }

        return new ProductoResponse(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getImagenUrl(),
                producto.getDisponible(),
                catResponse
        );
    }
}
