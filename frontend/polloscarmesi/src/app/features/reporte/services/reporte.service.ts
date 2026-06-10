import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { PagoReporte, ReporteFiltros, ProductoTop, CierreCajaData } from '../interfaces/reporte.interface';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/documentos`;

  obtenerDatosReporte(filtros: ReporteFiltros): Observable<PagoReporte[]> {
    const params = this.buildQueryParams(filtros);
    return this.http.get<PagoReporte[]>(`${this.baseUrl}/reportes/datos`, { params });
  }

  obtenerDatosReporteProductos(filtros: ReporteFiltros): Observable<ProductoTop[]> {
    const params = this.buildQueryParams(filtros);
    return this.http.get<ProductoTop[]>(`${this.baseUrl}/reportes/productos/datos`, { params });
  }

  obtenerDatosCierreCaja(filtros: ReporteFiltros): Observable<CierreCajaData> {
    const params = this.buildQueryParams(filtros);
    return this.http.get<CierreCajaData>(`${this.baseUrl}/reportes/cierre-caja/datos`, { params });
  }

  exportarExcel(filtros: ReporteFiltros, tipoReporte: string = 'ventas'): Observable<Blob> {
    let params = this.buildQueryParams(filtros);
    params = params.set('tipoReporte', tipoReporte);
    return this.http.get(`${this.baseUrl}/reportes/excel`, {
      params,
      responseType: 'blob'
    });
  }

  exportarPdf(filtros: ReporteFiltros, tipoReporte: string = 'ventas'): Observable<{ url: string }> {
    let params = this.buildQueryParams(filtros);
    params = params.set('tipoReporte', tipoReporte);
    return this.http.get<{ url: string }>(`${this.baseUrl}/reportes/pdf`, { params });
  }

  exportarCierreCajaExcel(filtros: ReporteFiltros): Observable<Blob> {
    const params = this.buildQueryParams(filtros);
    return this.http.get(`${this.baseUrl}/reportes/cierre-caja/excel`, {
      params,
      responseType: 'blob'
    });
  }

  exportarCierreCajaPdf(filtros: ReporteFiltros): Observable<{ url: string }> {
    const params = this.buildQueryParams(filtros);
    return this.http.get<{ url: string }>(`${this.baseUrl}/reportes/cierre-caja/pdf`, { params });
  }

  obtenerRecibo(pagoId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.baseUrl}/recibos/${pagoId}`);
  }

  private buildQueryParams(filtros: ReporteFiltros): HttpParams {
    let params = new HttpParams();
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', this.formatDate(filtros.fechaInicio));
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', this.formatDate(filtros.fechaFin));
    }
    if (filtros.tipoPedido) {
      params = params.set('tipoPedido', filtros.tipoPedido);
    }
    if (filtros.estadoPedido) {
      params = params.set('estadoPedido', filtros.estadoPedido);
    }
    if (filtros.metodoPago) {
      params = params.set('metodoPago', filtros.metodoPago);
    }
    if (filtros.limite) {
      params = params.set('limite', filtros.limite.toString());
    }
    if (filtros.saldoInicial !== undefined && filtros.saldoInicial !== null) {
      params = params.set('saldoInicial', filtros.saldoInicial.toString());
    }
    if (filtros.efectivoContado !== undefined && filtros.efectivoContado !== null) {
      params = params.set('efectivoContado', filtros.efectivoContado.toString());
    }
    return params;
  }

  private formatDate(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
  }
}
