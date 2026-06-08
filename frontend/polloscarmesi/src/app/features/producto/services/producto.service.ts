import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { Producto, ProductoInput } from '../interfaces/producto.interface';
import { Categoria } from '../interfaces/categoria.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = `${environment.apiUrl}/graphql`;

  obtenerMenu(categoriaId?: string | number): Observable<Producto[]> {
    const query = `
      query($categoriaId: ID) {
        obtenerMenu(categoriaId: $categoriaId) {
          id
          nombre
          descripcion
          precio
          imagenUrl
          disponible
          categoria {
            id
            nombre
            icon
          }
        }
      }
    `;
    const variables = categoriaId ? { categoriaId: categoriaId.toString() } : {};
    return this.http.post<{ data: { obtenerMenu: Producto[] } }>(this.graphqlUrl, { query, variables }).pipe(
      map(response => response.data.obtenerMenu)
    );
  }

  obtenerProducto(id: string | number): Observable<Producto> {
    const query = `
      query($id: ID!) {
        obtenerProducto(id: $id) {
          id
          nombre
          descripcion
          precio
          imagenUrl
          disponible
          categoria {
            id
            nombre
            icon
          }
        }
      }
    `;
    return this.http.post<{ data: { obtenerProducto: Producto } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString() }
    }).pipe(
      map(response => response.data.obtenerProducto)
    );
  }

  crearProducto(input: ProductoInput): Observable<Producto> {
    const query = `
      mutation($input: ProductoInput!) {
        crearProducto(input: $input) {
          id
          nombre
          descripcion
          precio
          imagenUrl
          disponible
          categoria {
            id
            nombre
            icon
          }
        }
      }
    `;
    return this.http.post<{ data: { crearProducto: Producto } }>(this.graphqlUrl, {
      query,
      variables: { input }
    }).pipe(
      map(response => response.data.crearProducto)
    );
  }

  actualizarProducto(id: string | number, input: ProductoInput): Observable<Producto> {
    const query = `
      mutation($id: ID!, $input: ProductoInput!) {
        actualizarProducto(id: $id, input: $input) {
          id
          nombre
          descripcion
          precio
          imagenUrl
          disponible
          categoria {
            id
            nombre
            icon
          }
        }
      }
    `;
    return this.http.post<{ data: { actualizarProducto: Producto } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString(), input }
    }).pipe(
      map(response => response.data.actualizarProducto)
    );
  }

  actualizarDisponibilidadProducto(id: string | number, disponible: boolean): Observable<Producto> {
    const query = `
      mutation($id: ID!, $disponible: Boolean!) {
        actualizarDisponibilidadProducto(id: $id, disponible: $disponible) {
          id
          nombre
          disponible
        }
      }
    `;
    return this.http.post<{ data: { actualizarDisponibilidadProducto: Producto } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString(), disponible }
    }).pipe(
      map(response => response.data.actualizarDisponibilidadProducto)
    );
  }

  eliminarProducto(id: string | number): Observable<boolean> {
    const query = `
      mutation($id: ID!) {
        eliminarProducto(id: $id)
      }
    `;
    return this.http.post<{ data: { eliminarProducto: boolean } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString() }
    }).pipe(
      map(response => response.data.eliminarProducto)
    );
  }

  // Self-contained category service calls to keep features completely independent
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

  crearCategoria(input: { nombre: string; descripcion?: string; icon?: string }): Observable<Categoria> {
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

  subirImagenProductoRest(id: string | number, file: File): Observable<Producto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Producto>(`${environment.apiUrl}/productos/${id}/imagen`, formData);
  }
}
