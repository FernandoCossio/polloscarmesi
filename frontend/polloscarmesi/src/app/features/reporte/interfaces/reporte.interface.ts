export interface PagoReporte {
  id: number;
  fecha: string;
  tipoPedido: string;
  metodoPago: string;
  estadoPago: string;
  montoTotal: number;
  numeroFicha?: string;
}

export interface ReporteFiltros {
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  tipoPedido?: string | null;
  estadoPedido?: string | null;
  metodoPago?: string | null;
  limite?: number | null;
  saldoInicial?: number | null;
  efectivoContado?: number | null;
}

export interface ProductoTop {
  ranking: number;
  idProducto: number;
  nombre: string;
  categoria: string;
  cantidadVendida: number;
  totalRecaudado: number;
}

export interface CierreCajaData {
  fechaInicio: string;
  fechaFin: string;
  generadoEn: string;
  cantidadPagos: number;
  totalVentas: number;
  cantidadPagosAceptados: number;
  totalVentasAceptadas: number;
  cantidadPagosPendientes: number;
  totalVentasPendientes: number;
  cantidadPagosRechazados: number;
  totalVentasRechazadas: number;
  cantidadPagosRevisionManual: number;
  totalVentasRevisionManual: number;
  cantidadPagosEfectivoAceptados: number;
  totalVentasEfectivoAceptadas: number;
  efectivoNetoIngresado: number;
  cantidadPagosQrAceptados: number;
  totalVentasQrAceptadas: number;
  saldoInicial: number;
  efectivoEsperadoEnCaja: number;
  efectivoContado: number;
  diferenciaEfectivo: number;
}

