import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Usuario, UsuarioCrearInput, UsuarioActualizarInput } from '../interfaces/usuario.interface';
import { ApiResponse } from '@/app/core/interface/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listarPersonal(rol?: string | null): Observable<ApiResponse<Usuario[]>> {
    let params = new HttpParams();
    if (rol) {
      params = params.set('rol', rol);
    }
    return this.http.get<ApiResponse<Usuario[]>>(`${this.baseUrl}/personal`, { params });
  }

  obtenerPorUuid(uuid: string): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.baseUrl}/${uuid}`);
  }

  crearPersonal(input: UsuarioCrearInput): Observable<ApiResponse<Usuario>> {
    return this.http.post<ApiResponse<Usuario>>(`${this.baseUrl}/personal`, input);
  }

  actualizarPersonal(uuid: string, input: UsuarioActualizarInput): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.baseUrl}/personal/${uuid}`, input);
  }

  cambiarEstado(uuid: string, activo: boolean): Observable<ApiResponse<Usuario>> {
    return this.http.patch<ApiResponse<Usuario>>(`${this.baseUrl}/personal/${uuid}/estado`, { activo });
  }
}
