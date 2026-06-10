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
public class ProductoTopResponse {
    private Integer ranking;
    private Long idProducto;
    private String nombre;
    private String categoria;
    private Long cantidadVendida;
    private BigDecimal totalRecaudado;
}
