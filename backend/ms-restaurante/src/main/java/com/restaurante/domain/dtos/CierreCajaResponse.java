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
public class CierreCajaResponse {
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private LocalDateTime generadoEn;

    private Long cantidadPagos;
    private BigDecimal totalVentas;

    private Long cantidadPagosAceptados;
    private BigDecimal totalVentasAceptadas;

    private Long cantidadPagosPendientes;
    private BigDecimal totalVentasPendientes;

    private Long cantidadPagosRechazados;
    private BigDecimal totalVentasRechazadas;

    private Long cantidadPagosRevisionManual;
    private BigDecimal totalVentasRevisionManual;

    private Long cantidadPagosEfectivoAceptados;
    private BigDecimal totalVentasEfectivoAceptadas;
    private BigDecimal efectivoNetoIngresado;

    private Long cantidadPagosQrAceptados;
    private BigDecimal totalVentasQrAceptadas;

    private BigDecimal saldoInicial;
    private BigDecimal efectivoEsperadoEnCaja;
    private BigDecimal efectivoContado;
    private BigDecimal diferenciaEfectivo;
}
