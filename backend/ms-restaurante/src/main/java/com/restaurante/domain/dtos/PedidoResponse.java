package com.restaurante.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PedidoResponse {
    private Long id;
    private String numeroFicha;
    private String tipo;
    private String estado;
    private BigDecimal subtotal;
    private BigDecimal descuento;
    private BigDecimal total;
    private Integer tiempoEstimadoPreparacion;
    private Long clienteId;
    private String motivoCancelacion;
    private List<DetallePedidoResponse> detalles;
    private String fechaCreacion;
}
