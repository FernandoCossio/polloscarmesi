package com.restaurante.features.productos;

import com.restaurante.domain.models.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findAllByCategoriaId(Long categoriaId);
    boolean existsByNombre(String nombre);
}
