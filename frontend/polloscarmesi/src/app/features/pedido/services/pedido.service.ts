import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';
import { Pedido, PedidoInput, Pago, PagoInput } from '../interfaces/pedido.interface';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = `${environment.apiUrl}/graphql`;

  obtenerPedido(id: string | number): Observable<Pedido> {
    const query = `
      query($id: ID!) {
        obtenerPedido(id: $id) {
          id
          numeroFicha
          tipo
          estado
          subtotal
          descuento
          total
          tiempoEstimadoPreparacion
          clienteId
          detalles {
            id
            cantidad
            precioUnitario
            subtotal
            producto {
              id
              nombre
              precio
            }
          }
          fechaCreacion
        }
      }
    `;
    return this.http.post<{ data: { obtenerPedido: Pedido } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString() }
    }).pipe(
      map(response => response.data.obtenerPedido)
    );
  }

  obtenerPedidosPorFecha(fecha: string): Observable<Pedido[]> {
    const query = `
      query($fecha: String!) {
        obtenerPedidosPorFecha(fecha: $fecha) {
          id
          numeroFicha
          tipo
          estado
          subtotal
          descuento
          total
          tiempoEstimadoPreparacion
          clienteId
          detalles {
            id
            cantidad
            precioUnitario
            subtotal
            producto {
              id
              nombre
              precio
            }
          }
          fechaCreacion
        }
      }
    `;
    return this.http.post<{ data: { obtenerPedidosPorFecha: Pedido[] } }>(this.graphqlUrl, {
      query,
      variables: { fecha }
    }).pipe(
      map(response => response.data.obtenerPedidosPorFecha)
    );
  }

  cancelarPedido(id: string | number, motivo: string): Observable<Pedido> {
    const query = `
      mutation($id: ID!, $motivo: String!) {
        cancelarPedido(id: $id, motivo: $motivo) {
          id
          numeroFicha
          estado
          motivoCancelacion
        }
      }
    `;
    return this.http.post<{ data: { cancelarPedido: Pedido } }>(this.graphqlUrl, {
      query,
      variables: { id: id.toString(), motivo }
    }).pipe(
      map(response => response.data.cancelarPedido)
    );
  }

  crearPedidoPresencial(input: PedidoInput): Observable<Pedido> {
    const query = `
      mutation($input: PedidoInput!) {
        crearPedidoPresencial(input: $input) {
          id
          numeroFicha
          tipo
          estado
          subtotal
          descuento
          total
          tiempoEstimadoPreparacion
          clienteId
          detalles {
            id
            cantidad
            precioUnitario
            subtotal
            producto {
              id
              nombre
              precio
            }
          }
          fechaCreacion
        }
      }
    `;
    return this.http.post<{ data: { crearPedidoPresencial: Pedido } }>(this.graphqlUrl, {
      query,
      variables: { input }
    }).pipe(
      map(response => response.data.crearPedidoPresencial)
    );
  }

  registrarPago(input: PagoInput): Observable<Pago> {
    const query = `
      mutation($input: PagoInput!) {
        registrarPago(input: $input) {
          id
          pedidoId
          metodo
          estado
          montoRecibido
          montoTotal
          cambio
          comprobanteUrl
          txHash
          fechaCreacion
        }
      }
    `;
    return this.http.post<{ data: { registrarPago: Pago } }>(this.graphqlUrl, {
      query,
      variables: { input }
    }).pipe(
      map(response => response.data.registrarPago)
    );
  }

  subirComprobantePago(pagoId: string | number, file: File): Observable<Pago> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Pago>(`${environment.apiUrl}/pagos/${pagoId}/comprobante`, formData);
  }
}
