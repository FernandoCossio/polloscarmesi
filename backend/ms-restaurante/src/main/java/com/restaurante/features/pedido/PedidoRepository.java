package com.restaurante.features.pedido;

import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.models.Pedido;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findAllByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Pedido> findAllByClienteId(Long clienteId, Pageable pageable);
    List<Pedido> findAllByEstadoIn(List<EstadoPedido> estados);
    long countByEstadoIn(List<EstadoPedido> estados);
    List<Pedido> findAllByCreatedAtBetweenAndEstado(LocalDateTime start, LocalDateTime end, EstadoPedido estado);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.createdAt BETWEEN :start AND :end AND p.estado = :estado")
    java.math.BigDecimal sumTotalByCreatedAtBetweenAndEstado(@org.springframework.data.repository.query.Param("start") LocalDateTime start, @org.springframework.data.repository.query.Param("end") LocalDateTime end, @org.springframework.data.repository.query.Param("estado") EstadoPedido estado);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(AVG(p.total), 0) FROM Pedido p WHERE p.createdAt BETWEEN :start AND :end AND p.estado = :estado")
    java.math.BigDecimal avgTotalByCreatedAtBetweenAndEstado(@org.springframework.data.repository.query.Param("start") LocalDateTime start, @org.springframework.data.repository.query.Param("end") LocalDateTime end, @org.springframework.data.repository.query.Param("estado") EstadoPedido estado);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Pedido p WHERE p.createdAt BETWEEN :start AND :end AND p.estado = :estado")
    long countByCreatedAtBetweenAndEstado(@org.springframework.data.repository.query.Param("start") LocalDateTime start, @org.springframework.data.repository.query.Param("end") LocalDateTime end, @org.springframework.data.repository.query.Param("estado") EstadoPedido estado);
}

