package com.restaurante.domain.dtos;

import com.restaurante.domain.enums.MetodoPago;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagoRequest {

    @NotNull(message = "El ID del pedido es obligatorio")
    private Long pedidoId;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodo;

    @NotNull(message = "El monto recibido es obligatorio")
    @DecimalMin(value = "0.0", message = "El monto recibido debe ser mayor o igual a 0")
    private BigDecimal montoRecibido;
}
