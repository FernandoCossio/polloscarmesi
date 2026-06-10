package com.restaurante.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagoReporteResponse {
    private Long id;
    private LocalDateTime fecha;
    private String tipoPedido;
    private String metodoPago;
    private String estadoPago;
    private BigDecimal montoTotal;
    private String numeroFicha;
}
