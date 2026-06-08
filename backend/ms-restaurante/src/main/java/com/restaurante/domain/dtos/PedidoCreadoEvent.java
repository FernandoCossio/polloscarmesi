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
public class PedidoCreadoEvent {
    private Long pedidoId;
    private String tipo;
    private Long clienteId;
    private List<PedidoCreadoProducto> productos;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PedidoCreadoProducto {
        private Long productoId;
        private Integer cantidad;
        private BigDecimal precioUnitario;
    }
}
