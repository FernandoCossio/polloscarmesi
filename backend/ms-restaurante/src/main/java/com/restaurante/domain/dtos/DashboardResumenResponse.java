package com.restaurante.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResumenResponse {
    private KpiCardResponse ventasTotales;
    private KpiCardResponse ticketPromedio;
    private KpiCardResponse pedidosEntregados;
    private KpiCardResponse tiempoCocinaPromedio;
}
