package com.restaurante.services;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.restaurante.domain.enums.TipoPedido;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class TiempoPedidoEstimacionClient {

    private final RestClient restClient;
    private final InternalServiceAuthService internalServiceAuthService;
    private final String msIaBaseUrl;

    public TiempoPedidoEstimacionClient(RestClient.Builder restClientBuilder,
                                        InternalServiceAuthService internalServiceAuthService,
                                        @Value("${app.ms-ia.base-url}") String msIaBaseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        this.restClient = restClientBuilder
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();
        this.internalServiceAuthService = internalServiceAuthService;
        this.msIaBaseUrl = msIaBaseUrl;
    }

    public Integer estimarTiempoPedido(LocalDateTime fechaHoraPedido,
                                       Integer cantidadItems,
                                       BigDecimal totalPedido,
                                       Long pedidosPendientes,
                                       TipoPedido tipoPedido,
                                       Double distanciaKm,
                                       boolean requiereCoccion) {
        TiempoPedidoEstimacionResponse responseBody = restClient.post()
                .uri(msIaBaseUrl + "/tiempo-pedidos/estimar")
                .header(HttpHeaders.AUTHORIZATION, internalServiceAuthService.getAuthorizationHeader())
                .contentType(MediaType.APPLICATION_JSON)
                .body(new TiempoPedidoEstimacionRequest(
                        fechaHoraPedido,
                        cantidadItems,
                        totalPedido,
                        pedidosPendientes,
                        tipoPedido.name(),
                        distanciaKm,
                        requiereCoccion ? "SI" : "NO"
                ))
                .retrieve()
                .body(TiempoPedidoEstimacionResponse.class);

        if (responseBody == null
                || responseBody.data() == null
                || responseBody.data().tiempoEstimadoMin() == null) {
            throw new IllegalStateException("ms-ia no devolvio un tiempo estimado valido");
        }

        return Math.max(1, (int) Math.ceil(responseBody.data().tiempoEstimadoMin()));
    }

    private record TiempoPedidoEstimacionRequest(
            @JsonProperty("fecha_hora_pedido") LocalDateTime fechaHoraPedido,
            @JsonProperty("cantidad_items") Integer cantidadItems,
            @JsonProperty("total_pedido") BigDecimal totalPedido,
            @JsonProperty("pedidos_pendientes") Long pedidosPendientes,
            @JsonProperty("tipo_pedido") String tipoPedido,
            @JsonProperty("distancia_km") Double distanciaKm,
            @JsonProperty("requiere_coccion") String requiereCoccion
    ) {
    }

    private record TiempoPedidoEstimacionResponse(
            String status,
            TiempoPedidoEstimacionData data,
            String message
    ) {
    }

    private record TiempoPedidoEstimacionData(
            @JsonProperty("tiempo_estimado_min") Double tiempoEstimadoMin,
            @JsonProperty("tipo_pedido") String tipoPedido,
            @JsonProperty("requiere_coccion") String requiereCoccion
    ) {
    }
}
