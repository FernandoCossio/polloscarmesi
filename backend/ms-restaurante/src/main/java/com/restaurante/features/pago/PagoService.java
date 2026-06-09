package com.restaurante.features.pago;

import com.restaurante.domain.dtos.PagoRegistradoEvent;
import com.restaurante.domain.dtos.PagoRequest;
import com.restaurante.domain.dtos.PagoResponse;
import com.restaurante.domain.enums.EstadoPago;
import com.restaurante.domain.enums.MetodoPago;
import com.restaurante.domain.models.Pago;
import com.restaurante.domain.models.Pedido;
import com.restaurante.features.pago.exceptions.PagoInvalidoException;
import com.restaurante.features.pago.exceptions.PagoNoEncontradoException;
import com.restaurante.features.pedido.PedidoRepository;
import com.restaurante.features.pedido.RedisEventPublisher;
import com.restaurante.features.pedido.exceptions.PedidoNoEncontradoException;
import com.restaurante.services.ImageStorageService;
import com.restaurante.services.StorageOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
public class PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final ImageStorageService imageStorageService;
    private final RedisEventPublisher redisEventPublisher;

    public PagoService(PagoRepository pagoRepository,
                       PedidoRepository pedidoRepository,
                       ImageStorageService imageStorageService,
                       RedisEventPublisher redisEventPublisher) {
        this.pagoRepository = pagoRepository;
        this.pedidoRepository = pedidoRepository;
        this.imageStorageService = imageStorageService;
        this.redisEventPublisher = redisEventPublisher;
    }

    public PagoResponse findById(Long id) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(PagoNoEncontradoException::new);
        return mapToResponse(pago);
    }

    public List<PagoResponse> findAll() {
        return pagoRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PagoResponse create(PagoRequest request) {
        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .orElseThrow(PedidoNoEncontradoException::new);

        if (pagoRepository.existsByPedidoId(request.getPedidoId())) {
            throw new PagoInvalidoException("El pedido con ID " + request.getPedidoId() + " ya tiene un pago registrado");
        }

        BigDecimal montoTotal = pedido.getTotal();
        if (request.getMontoRecibido().compareTo(montoTotal) < 0) {
            throw new PagoInvalidoException("El monto recibido (" + request.getMontoRecibido() + 
                    ") es inferior al total del pedido (" + montoTotal + ")");
        }

        Pago pago = new Pago();
        pago.setPedido(pedido);
        pago.setMetodo(request.getMetodo());
        pago.setMontoTotal(montoTotal);
        pago.setMontoRecibido(request.getMontoRecibido());
        pago.setEstado(EstadoPago.REVISION_MANUAL); // Siempre Revisión Manual por defecto

        if (request.getMetodo() == MetodoPago.EFECTIVO) {
            pago.setCambio(request.getMontoRecibido().subtract(montoTotal));
        } else {
            pago.setCambio(BigDecimal.ZERO);
        }

        // TODO: Agregar integración con Blockchain (txHash) en fase futura.
        pago.setTxHash(null);

        Pago saved = pagoRepository.save(pago);

        // Si es efectivo, como no requiere subida de archivo para comprobar, publicamos de inmediato
        if (saved.getMetodo() == MetodoPago.EFECTIVO) {
            redisEventPublisher.publishPagoRegistrado(new PagoRegistradoEvent(
                    saved.getPedido().getId(),
                    saved.getId(),
                    null
            ));
        }

        return mapToResponse(saved);
    }

    @Transactional
    public PagoResponse uploadComprobante(Long id, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de comprobante no puede estar vacío");
        }

        Pago pago = pagoRepository.findById(id)
                .orElseThrow(PagoNoEncontradoException::new);

        if (pago.getComprobanteUrl() != null) {
            try {
                imageStorageService.delete(pago.getComprobanteUrl());
            } catch (Exception e) {
                log.warn("No se pudo borrar el comprobante anterior de pago ID {}: {}", id, e.getMessage());
            }
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String datePath = now.format(java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String timestamp = now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String customKey = String.format("comprobantes/%s/%d-%s.%s", datePath, id, timestamp, extension);

        String savedPath = imageStorageService.store(file, customKey);
        pago.setComprobanteUrl(savedPath);
        pago.setComprobanteS3Key(customKey);
        pago.setFechaSubida(now);

        Pago updated = pagoRepository.save(pago);

        // Publicar evento en Redis al subir exitosamente el comprobante
        redisEventPublisher.publishPagoRegistrado(new PagoRegistradoEvent(
                updated.getPedido().getId(),
                updated.getId(),
                updated.getComprobanteUrl()
        ));

        return mapToResponse(updated);
    }

    public PagoResponse mapToResponse(Pago pago) {
        String fechaCreacion = "";
        if (pago.getCreatedAt() != null) {
            fechaCreacion = pago.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }

        String comprobanteUrl = pago.getComprobanteUrl();
        if (pago.getComprobanteS3Key() != null && !pago.getComprobanteS3Key().isBlank()) {
            try {
                comprobanteUrl = imageStorageService.generatePresignedUrl(pago.getComprobanteS3Key());
            } catch (Exception e) {
                log.warn("No se pudo generar la URL firmada para el pago ID {}: {}", pago.getId(), e.getMessage());
            }
        }

        return new PagoResponse(
                pago.getId(),
                pago.getPedido().getId(),
                pago.getMetodo().name(),
                pago.getEstado().name(),
                pago.getMontoRecibido(),
                pago.getMontoTotal(),
                pago.getCambio(),
                comprobanteUrl,
                pago.getTxHash(),
                fechaCreacion
        );
    }
}
