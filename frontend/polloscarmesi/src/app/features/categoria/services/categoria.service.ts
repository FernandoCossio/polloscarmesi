import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { Categoria, CategoriaInput } from '../interfaces/categoria.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = `${environment.apiUrl}/graphql`;

  obtenerCategorias(): Observable<Categoria[]> {
    const query = `
      query {
        obtenerCategorias {
          id
          nombre
          descripcion
          icon
        }
      }
    `;
    return this.http.post<{ data: { obtenerCategorias: Categoria[] } }>(this.graphqlUrl, { query }).pipe(
      map(response => response.data.obtenerCategorias)
    );
  }

  obtenerCategoriaPorId(id: string | number): Observable<Categoria> {
    const query = `
      query($id: ID!) {
        obtenerCategoriaPorId(id: $id) {
          id
          nombre
          descripcion
          icon
        }
      }
    `;
    return this.http.post<{ data: { obtenerCategoriaPorId: Categoria } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString() }
    }).pipe(
      map(response => response.data.obtenerCategoriaPorId)
    );
  }

  crearCategoria(input: CategoriaInput): Observable<Categoria> {
    const query = `
      mutation($input: CategoriaInput!) {
        crearCategoria(input: $input) {
          id
          nombre
          descripcion
          icon
        }
      }
    `;
    return this.http.post<{ data: { crearCategoria: Categoria } }>(this.graphqlUrl, {
      query,
      variables: { input }
    }).pipe(
      map(response => response.data.crearCategoria)
    );
  }

  actualizarCategoria(id: string | number, input: CategoriaInput): Observable<Categoria> {
    const query = `
      mutation($id: ID!, $input: CategoriaInput!) {
        actualizarCategoria(id: $id, input: $input) {
          id
          nombre
          descripcion
          icon
        }
      }
    `;
    return this.http.post<{ data: { actualizarCategoria: Categoria } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString(), input }
    }).pipe(
      map(response => response.data.actualizarCategoria)
    );
  }

  eliminarCategoria(id: string | number): Observable<boolean> {
    const query = `
      mutation($id: ID!) {
        eliminarCategoria(id: $id)
      }
    `;
    return this.http.post<{ data: { eliminarCategoria: boolean } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString() }
    }).pipe(
      map(response => response.data.eliminarCategoria)
    );
  }
}
