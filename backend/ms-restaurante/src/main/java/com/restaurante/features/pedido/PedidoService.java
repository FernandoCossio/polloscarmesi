package com.restaurante.features.pedido;

import com.restaurante.domain.dtos.*;
import com.restaurante.domain.enums.EstadoPedido;
import com.restaurante.domain.enums.TipoPedido;
import com.restaurante.domain.models.DetallePedido;
import com.restaurante.domain.models.Pedido;
import com.restaurante.domain.models.Producto;
import com.restaurante.features.pedido.exceptions.PedidoEstadoInvalidoException;
import com.restaurante.features.pedido.exceptions.PedidoNoEncontradoException;
import com.restaurante.features.productos.ProductoRepository;
import com.restaurante.features.productos.exceptions.ProductoNoEncontradoException;
import com.restaurante.services.TiempoPedidoEstimacionClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
public class PedidoService {

    private static final int DEFAULT_TIEMPO_ESTIMADO_PREPARACION = 20;
    private static final List<EstadoPedido> ACTIVE_STATES = List.of(
            EstadoPedido.PENDIENTE,
            EstadoPedido.CONFIRMADO,
            EstadoPedido.EN_PREPARACION,
            EstadoPedido.EN_CAMINO,
            EstadoPedido.LISTO
    );

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final RedisEventPublisher redisEventPublisher;
    private final TiempoPedidoEstimacionClient tiempoPedidoEstimacionClient;

    public PedidoService(PedidoRepository pedidoRepository,
                         ProductoRepository productoRepository,
                         RedisEventPublisher redisEventPublisher,
                         TiempoPedidoEstimacionClient tiempoPedidoEstimacionClient) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.redisEventPublisher = redisEventPublisher;
        this.tiempoPedidoEstimacionClient = tiempoPedidoEstimacionClient;
    }

    public PedidoResponse findById(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(PedidoNoEncontradoException::new);
        return mapToResponse(pedido);
    }

    public List<PedidoResponse> findByFecha(String fechaStr) {
        LocalDate date = LocalDate.parse(fechaStr);
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return pedidoRepository.findAllByCreatedAtBetween(start, end).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PedidoResponse> findHistoricos(Long clienteId, Integer limit) {
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(0, pageSize, Sort.by("createdAt").descending());
        return pedidoRepository.findAllByClienteId(clienteId, pageable).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PedidoResponse> findActivePedidos() {
        return pedidoRepository.findAllByEstadoIn(ACTIVE_STATES).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PedidoResponse create(PedidoRequest request) {
        Pedido pedido = new Pedido();
        
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
        long count = pedidoRepository.findAllByCreatedAtBetween(start, end).size();
        String numeroFicha = String.format("F-%03d", count + 1);
        pedido.setNumeroFicha(numeroFicha);

        pedido.setTipo(request.getTipo());
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setClienteId(request.getClienteId());
        
        BigDecimal descuento = request.getDescuento() != null ? request.getDescuento() : BigDecimal.ZERO;
        pedido.setDescuento(descuento);

        List<DetallePedido> detalles = new ArrayList<>();
        BigDecimal subtotalAcumulado = BigDecimal.ZERO;

        for (DetallePedidoRequest detReq : request.getDetalles()) {
            Producto producto = productoRepository.findById(detReq.getProductoId())
                    .orElseThrow(ProductoNoEncontradoException::new);

            if (!producto.getDisponible()) {
                throw new PedidoEstadoInvalidoException("El producto '" + producto.getNombre() + "' no está disponible");
            }

            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(detReq.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            
            BigDecimal lineSubtotal = producto.getPrecio().multiply(BigDecimal.valueOf(detReq.getCantidad()));
            detalle.setSubtotal(lineSubtotal);
            subtotalAcumulado = subtotalAcumulado.add(lineSubtotal);

            detalles.add(detalle);
        }

        pedido.setSubtotal(subtotalAcumulado);
        BigDecimal total = subtotalAcumulado.subtract(descuento);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        pedido.setTotal(total);
        pedido.setDetalles(detalles);
        pedido.setTiempoEstimadoPreparacion(estimarTiempoPreparacion(request, detalles, total));

        Pedido saved = pedidoRepository.save(pedido);

        // Publicar evento pedido.creado en Redis
        List<PedidoCreadoEvent.PedidoCreadoProducto> eventProductos = saved.getDetalles().stream()
                .map(d -> new PedidoCreadoEvent.PedidoCreadoProducto(
                        d.getProducto().getId(),
                        d.getCantidad(),
                        d.getPrecioUnitario()
                ))
                .collect(Collectors.toList());

        PedidoCreadoEvent event = new PedidoCreadoEvent(
                saved.getId(),
                saved.getTipo().name(),
                saved.getClienteId(),
                eventProductos
        );

        redisEventPublisher.publishPedidoCreado(event);

        return mapToResponse(saved);
    }

    @Transactional
    public PedidoResponse cancelar(Long id, String motivo) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(PedidoNoEncontradoException::new);

        if (pedido.getEstado() == EstadoPedido.ENTREGADO) {
            throw new PedidoEstadoInvalidoException("No se puede cancelar un pedido que ya ha sido entregado");
        }
        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new PedidoEstadoInvalidoException("El pedido ya se encuentra cancelado");
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setMotivoCancelacion(motivo);
        Pedido updated = pedidoRepository.save(pedido);
        return mapToResponse(updated);
    }

    @Transactional
    public PedidoResponse sincronizarEstadoDelivery(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(PedidoNoEncontradoException::new);

        if (pedido.getTipo() != TipoPedido.DELIVERY) {
            throw new PedidoEstadoInvalidoException("Solo se puede sincronizar el estado de delivery para pedidos de tipo DELIVERY");
        }

        pedido.setEstado(nuevoEstado);
        Pedido updated = pedidoRepository.save(pedido);
        return mapToResponse(updated);
    }

    @Transactional
    public PedidoResponse actualizarEstadoCocina(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(PedidoNoEncontradoException::new);

        if (pedido.getEstado() == EstadoPedido.CANCELADO || pedido.getEstado() == EstadoPedido.ENTREGADO) {
            throw new PedidoEstadoInvalidoException("No se puede modificar el estado de cocina de un pedido cancelado o entregado");
        }

        pedido.setEstado(nuevoEstado);
        Pedido updated = pedidoRepository.save(pedido);
        return mapToResponse(updated);
    }

    public PedidoResponse mapToResponse(Pedido pedido) {
        List<DetallePedidoResponse> detalleResponses = pedido.getDetalles().stream()
                .map(d -> new DetallePedidoResponse(
                        d.getId(),
                        mapProductoToResponse(d.getProducto()),
                        d.getCantidad(),
                        d.getPrecioUnitario(),
                        d.getSubtotal()
                ))
                .collect(Collectors.toList());

        String fechaCreacion = "";
        if (pedido.getCreatedAt() != null) {
            fechaCreacion = pedido.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }

        return new PedidoResponse(
                pedido.getId(),
                pedido.getNumeroFicha(),
                pedido.getTipo().name(),
                pedido.getEstado().name(),
                pedido.getSubtotal(),
                pedido.getDescuento(),
                pedido.getTotal(),
                pedido.getTiempoEstimadoPreparacion(),
                pedido.getClienteId(),
                pedido.getMotivoCancelacion(),
                detalleResponses,
                fechaCreacion
        );
    }

    private ProductoResponse mapProductoToResponse(Producto producto) {
        CategoriaResponse catResponse = null;
        if (producto.getCategoria() != null) {
            var cat = producto.getCategoria();
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

    private Integer estimarTiempoPreparacion(PedidoRequest request, List<DetallePedido> detalles, BigDecimal totalPedido) {
        int cantidadItems = detalles.stream()
                .mapToInt(DetallePedido::getCantidad)
                .sum();
        long pedidosPendientes = pedidoRepository.countByEstadoIn(ACTIVE_STATES);
        boolean requiereCoccion = detalles.stream().anyMatch(this::requiereCoccion);

        try {
            return tiempoPedidoEstimacionClient.estimarTiempoPedido(
                    LocalDateTime.now(),
                    cantidadItems,
                    totalPedido,
                    pedidosPendientes,
                    request.getTipo(),
                    0.0,
                    requiereCoccion
            );
        } catch (Exception error) {
            log.warn("No se pudo estimar el tiempo del pedido con ms-ia. Se usará el valor por defecto de {} minutos: {}",
                    DEFAULT_TIEMPO_ESTIMADO_PREPARACION,
                    error.getMessage());
            return DEFAULT_TIEMPO_ESTIMADO_PREPARACION;
        }
    }

    private boolean requiereCoccion(DetallePedido detalle) {
        if (detalle.getProducto().getCategoria() == null || detalle.getProducto().getCategoria().getNombre() == null) {
            return true;
        }

        String categoria = detalle.getProducto().getCategoria().getNombre().trim().toLowerCase(Locale.ROOT);
        return !categoria.equals("bebidas");
    }
}
