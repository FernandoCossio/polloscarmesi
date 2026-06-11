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
public class KpiCardResponse {
    private BigDecimal valor;
    private String unidad;
    private BigDecimal diferenciaPorcentaje;
}
