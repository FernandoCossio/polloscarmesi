package com.restaurante.domain.dtos;

import com.restaurante.domain.enums.TipoPedido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class PedidoRequest {

    private String numeroFicha;

    @NotNull(message = "El tipo de pedido es obligatorio")
    private TipoPedido tipo;

    @DecimalMin(value = "0.0", message = "El descuento debe ser mayor o igual a 0")
    private BigDecimal descuento;

    private Long clienteId;

    @NotEmpty(message = "El pedido debe tener al menos un detalle de producto")
    @Valid
    private List<DetallePedidoRequest> detalles;
}
