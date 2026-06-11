import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { Configuracion, ConfiguracionInput } from '../interfaces/configuracion.interface';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = `${environment.apiUrl}/graphql`;

  obtenerConfiguracion(): Observable<Configuracion> {
    const query = `
      query {
        obtenerConfiguracion {
          nombreRestaurante
          ruc
          direccion
          telefono
          horarioAtencion
          tiempoMaximoPreparacion
          umbralAlertaCocina
          coordenadas
        }
      }
    `;
    return this.http.post<{ data: { obtenerConfiguracion: Configuracion } }>(this.graphqlUrl, { query }).pipe(
      map(response => response.data.obtenerConfiguracion)
    );
  }

  actualizarConfiguracion(input: ConfiguracionInput): Observable<Configuracion> {
    const query = `
      mutation($input: ConfiguracionInput!) {
        actualizarConfiguracion(input: $input) {
          nombreRestaurante
          ruc
          direccion
          telefono
          horarioAtencion
          tiempoMaximoPreparacion
          umbralAlertaCocina
          coordenadas
        }
      }
    `;
    return this.http.post<{ data: { actualizarConfiguracion: Configuracion } }>(this.graphqlUrl, {
      query,
      variables: { input }
    }).pipe(
      map(response => response.data.actualizarConfiguracion)
    );
  }
}
