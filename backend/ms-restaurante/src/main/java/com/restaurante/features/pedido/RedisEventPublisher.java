package com.restaurante.features.pedido;

import com.restaurante.domain.dtos.ConfiguracionActualizadaEvent;
import com.restaurante.domain.dtos.PedidoCreadoEvent;
import com.restaurante.domain.dtos.PagoRegistradoEvent;
import com.restaurante.domain.dtos.CocinaEstadoCambioEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RedisEventPublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String PEDIDO_CREADO_CHANNEL = "pedido.creado";
    private static final String PAGO_REGISTRADO_CHANNEL = "pago.registrado";
    private static final String COCINA_ESTADO_CHANNEL = "cocina.estado_cambiado";
    private static final String CONFIGURACION_ACTUALIZADA_CHANNEL = "configuracion.actualizada";

    public RedisEventPublisher(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publishPedidoCreado(PedidoCreadoEvent event) {
        try {
            log.info("Publicando evento pedido.creado a Redis para pedido ID: {}", event.getPedidoId());
            redisTemplate.convertAndSend(PEDIDO_CREADO_CHANNEL, event);
        } catch (Exception e) {
            log.error("Error al publicar evento pedido.creado en Redis para pedido ID {}: {}", event.getPedidoId(), e.getMessage(), e);
        }
    }

    public void publishPagoRegistrado(PagoRegistradoEvent event) {
        try {
            log.info("Publicando evento pago.registrado a Redis para pago ID: {}", event.getPagoId());
            redisTemplate.convertAndSend(PAGO_REGISTRADO_CHANNEL, event);
        } catch (Exception e) {
            log.error("Error al publicar evento pago.registrado en Redis para pago ID {}: {}", event.getPagoId(), e.getMessage(), e);
        }
    }

    public void publishCocinaEstadoCambio(CocinaEstadoCambioEvent event) {
        try {
            log.info("Publicando evento cocina.estado_cambiado a Redis para pedido ID: {}", event.getPedidoId());
            redisTemplate.convertAndSend(COCINA_ESTADO_CHANNEL, event);
        } catch (Exception e) {
            log.error("Error al publicar evento cocina.estado_cambiado en Redis para pedido ID {}: {}", event.getPedidoId(), e.getMessage(), e);
        }
    }

    public void publishConfiguracionActualizada(ConfiguracionActualizadaEvent event) {
        try {
            log.info("Publicando evento configuracion.actualizada para restaurante: {}", event.getNombreRestaurante());
            redisTemplate.convertAndSend(CONFIGURACION_ACTUALIZADA_CHANNEL, event);
        } catch (Exception e) {
            log.error("Error al publicar evento configuracion.actualizada para restaurante {}: {}", event.getNombreRestaurante(), e.getMessage(), e);
        }
    }
}
