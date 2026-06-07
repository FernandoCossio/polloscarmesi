package com.restaurante.features.categoria;

import com.restaurante.features.categoria.exceptions.CategoriaDuplicadaException;
import com.restaurante.features.categoria.exceptions.CategoriaNoEncontradaException;
import com.restaurante.domain.dtos.CategoriaRequest;
import com.restaurante.domain.dtos.CategoriaResponse;
import com.restaurante.domain.models.Categoria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public List<CategoriaResponse> findAll() {
        return categoriaRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CategoriaResponse findById(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(CategoriaNoEncontradaException::new);
        return mapToResponse(categoria);
    }

    @Transactional
    public CategoriaResponse create(CategoriaRequest request) {
        if (categoriaRepository.existsByNombre(request.getNombre())) {
            throw new CategoriaDuplicadaException();
        }

        Categoria categoria = new Categoria();
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setIcon(request.getIcon());

        Categoria saved = categoriaRepository.save(categoria);
        return mapToResponse(saved);
    }

    @Transactional
    public CategoriaResponse update(Long id, CategoriaRequest request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(CategoriaNoEncontradaException::new);

        categoriaRepository.findByNombre(request.getNombre())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new CategoriaDuplicadaException();
                    }
                });

        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setIcon(request.getIcon());
        Categoria updated = categoriaRepository.save(categoria);
        return mapToResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(CategoriaNoEncontradaException::new);

        // Soft delete
        categoria.setIsDeleted(true);
        categoriaRepository.save(categoria);
    }

    public CategoriaResponse mapToResponse(Categoria categoria) {
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNombre(),
                categoria.getDescripcion(),
                categoria.getIcon()
        );
    }
}
