package com.restaurante.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagoResponse {
    private Long id;
    private Long pedidoId;
    private String metodo;
    private String estado;
    private BigDecimal montoRecibido;
    private BigDecimal montoTotal;
    private BigDecimal cambio;
    private String comprobanteUrl;
    private String txHash;
    private String fechaCreacion;
}
