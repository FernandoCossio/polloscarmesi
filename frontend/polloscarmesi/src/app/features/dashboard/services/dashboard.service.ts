import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { DashboardResumenResponse, GraficoLineaResponse, GraficoBarrasResponse } from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  getResumenKPIs(): Observable<DashboardResumenResponse> {
    return this.http.get<DashboardResumenResponse>(`${this.baseUrl}/resumen`);
  }

  getVentasPorHora(): Observable<GraficoLineaResponse[]> {
    return this.http.get<GraficoLineaResponse[]>(`${this.baseUrl}/ventas-tiempo`);
  }

  getTopProductos(): Observable<GraficoBarrasResponse[]> {
    return this.http.get<GraficoBarrasResponse[]>(`${this.baseUrl}/productos-top`);
  }
}
