package com.restaurante.domain.dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionRequest {

    @NotBlank(message = "El nombre del restaurante es obligatorio")
    private String nombreRestaurante;

    @NotBlank(message = "El RUC es obligatorio")
    private String ruc;

    @NotBlank(message = "La dirección es obligatoria")
    private String direccion;

    @NotBlank(message = "El teléfono es obligatorio")
    private String telefono;

    @NotBlank(message = "El horario de atención es obligatorio")
    private String horarioAtencion;

    @NotNull(message = "El tiempo máximo de preparación es obligatorio")
    @Min(value = 1, message = "El tiempo máximo de preparación debe ser al menos 1 minuto")
    private Integer tiempoMaximoPreparacion;

    @NotNull(message = "El umbral de alerta de cocina es obligatorio")
    @Min(value = 1, message = "El umbral de alerta de cocina debe ser al menos 1 minuto")
    private Integer umbralAlertaCocina;

    @NotBlank(message = "Las coordenadas son obligatorias")
    private String coordenadas;
}
