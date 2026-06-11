package com.restaurante.features.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurante.domain.dtos.CocinaEstadoCambioEvent;
import com.restaurante.domain.dtos.PagoRegistradoEvent;
import com.restaurante.domain.dtos.PedidoCreadoEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class DashboardEventSubscriber implements MessageListener {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final DashboardService dashboardService;

    public DashboardEventSubscriber(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        byte[] body = message.getBody();

        log.info("Mensaje de Redis recibido en el canal: {}", channel);

        try {
            if ("pedido.creado".equals(channel)) {
                PedidoCreadoEvent event = deserialize(body, PedidoCreadoEvent.class);
                log.info("Evento pedido.creado procesado por Dashboard para pedido ID: {}", event.getPedidoId());
                dashboardService.invalidateResumenAndVentas();
            } else if ("pago.registrado".equals(channel)) {
                PagoRegistradoEvent event = deserialize(body, PagoRegistradoEvent.class);
                log.info("Evento pago.registrado procesado por Dashboard para pedido ID: {}", event.getPedidoId());
                dashboardService.invalidateResumenAndVentas();
            } else if ("cocina.estado_cambiado".equals(channel)) {
                CocinaEstadoCambioEvent event = deserialize(body, CocinaEstadoCambioEvent.class);
                log.info("Evento cocina.estado_cambiado procesado por Dashboard para pedido ID: {}, estado: {}", event.getPedidoId(), event.getNuevoEstado());
                dashboardService.invalidateAllCache();
            }
        } catch (Exception e) {
            log.error("Error al deserializar y procesar evento en canal {}: {}", channel, e.getMessage(), e);
        }
    }

    private <T> T deserialize(byte[] body, Class<T> clazz) throws IOException {
        try {
            return OBJECT_MAPPER.readValue(body, clazz);
        } catch (Exception e) {
            String jsonStr = new String(body);
            if (jsonStr.startsWith("\"") && jsonStr.endsWith("\"") && jsonStr.length() > 2) {
                jsonStr = jsonStr.substring(1, jsonStr.length() - 1).replace("\\\"", "\"");
            }
            return OBJECT_MAPPER.readValue(jsonStr, clazz);
        }
    }
}
