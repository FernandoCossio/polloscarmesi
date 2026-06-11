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
}
