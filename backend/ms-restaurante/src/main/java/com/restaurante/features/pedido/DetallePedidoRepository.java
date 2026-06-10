package com.restaurante.features.pedido;

import com.restaurante.domain.models.DetallePedido;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Long> {

    @Query("SELECT dp.producto, SUM(dp.cantidad) as totalCantidad, SUM(dp.subtotal) as totalRecaudado " +
           "FROM DetallePedido dp " +
           "WHERE dp.createdAt >= COALESCE(:fechaInicio, dp.createdAt) " +
           "AND dp.createdAt <= COALESCE(:fechaFin, dp.createdAt) " +
           "GROUP BY dp.producto " +
           "ORDER BY SUM(dp.cantidad) DESC")
    List<Object[]> findTopProducts(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin,
            Pageable pageable
    );
}
