package com.restaurante.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionActualizadaEvent {
    private String nombreRestaurante;
    private String ruc;
    private String direccion;
    private String telefono;
    private String horarioAtencion;
    private Integer tiempoMaximoPreparacion;
    private Integer umbralAlertaCocina;
    private String coordenadas;
}
