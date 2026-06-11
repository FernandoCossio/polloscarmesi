export interface KpiCardResponse {
  valor: number;
  unidad: string;
  diferenciaPorcentaje: number;
}

export interface DashboardResumenResponse {
  ventasTotales: KpiCardResponse;
  ticketPromedio: KpiCardResponse;
  pedidosEntregados: KpiCardResponse;
  tiempoCocinaPromedio: KpiCardResponse;
}

export interface GraficoLineaResponse {
  label: string;
  valor: number;
}

export interface GraficoBarrasResponse {
  label: string;
  valor: number;
}
