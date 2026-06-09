package com.restaurante.features.cocina;

import com.restaurante.domain.dtos.CocinaEstadoCambioEvent;
import com.restaurante.domain.dtos.PedidoResponse;
import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.models.Pedido;
import com.restaurante.features.pedido.exceptions.PedidoEstadoInvalidoException;
import com.restaurante.features.pedido.exceptions.PedidoNoEncontradoException;
import com.restaurante.features.pedido.PedidoRepository;
import com.restaurante.features.pedido.PedidoService;
import com.restaurante.features.pedido.RedisEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
public class CocinaService {

    private final PedidoRepository pedidoRepository;
    private final PedidoService pedidoService;
    private final RedisEventPublisher redisEventPublisher;

    public CocinaService(PedidoRepository pedidoRepository,
                         PedidoService pedidoService,
                         RedisEventPublisher redisEventPublisher) {
        this.pedidoRepository = pedidoRepository;
        this.pedidoService = pedidoService;
        this.redisEventPublisher = redisEventPublisher;
    }

    public List<PedidoResponse> obtenerColaCocina() {
        List<EstadoPedido> kitchenStates = Arrays.asList(
                EstadoPedido.PENDIENTE,
                EstadoPedido.CONFIRMADO,
                EstadoPedido.EN_PREPARACION
        );

        return pedidoRepository.findAllByEstadoIn(kitchenStates).stream()
                .sorted(Comparator.comparing(Pedido::getCreatedAt))
                .map(pedidoService::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PedidoResponse actualizarEstadoCocina(Long pedidoId, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(PedidoNoEncontradoException::new);

        if (pedido.getEstado() == EstadoPedido.CANCELADO || pedido.getEstado() == EstadoPedido.ENTREGADO) {
            throw new PedidoEstadoInvalidoException("No se puede modificar el estado de cocina de un pedido cancelado o entregado");
        }

        // Validar transiciones de cocina permitidas
        if (nuevoEstado != EstadoPedido.EN_PREPARACION && nuevoEstado != EstadoPedido.LISTO && nuevoEstado != EstadoPedido.PENDIENTE) {
            throw new PedidoEstadoInvalidoException("Estado de cocina inválido: " + nuevoEstado);
        }

        pedido.setEstado(nuevoEstado);
        Pedido saved = pedidoRepository.save(pedido);

        // Notificar cambio de estado via Redis
        redisEventPublisher.publishCocinaEstadoCambio(new CocinaEstadoCambioEvent(
                saved.getId(),
                saved.getEstado().name()
        ));

        return pedidoService.mapToResponse(saved);
    }
}
