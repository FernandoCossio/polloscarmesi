import { GATEWAY_URL, AuthService } from './auth-service';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  icon?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  disponible: boolean;
  categoria?: Categoria;
}

export const RestaurantService = {
  async obtenerCategorias(): Promise<Categoria[]> {
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

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener categorías';
        throw new Error(errMsg);
      }

      return json.data.obtenerCategorias;
    } catch (err) {
      console.error('Error fetching categories from GraphQL:', err);
      throw err;
    }
  },

  async obtenerMenu(categoriaId?: string): Promise<Producto[]> {
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

    const variables = categoriaId ? { categoriaId } : {};

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener productos';
        throw new Error(errMsg);
      }

      return json.data.obtenerMenu;
    } catch (err) {
      console.error('Error fetching menu from GraphQL:', err);
      throw err;
    }
  },

  async crearPedidoDelivery(input: {
    clienteId: string;
    direccionEntrega: string;
    referencia?: string;
    latitud?: number;
    longitud?: number;
    subtotal: number;
    descuento?: number;
    total: number;
    detalles: {
      productoId: string;
      nombreProducto: string;
      cantidad: number;
      precioUnitario: number;
    }[];
  }): Promise<any> {
    const mutation = `
      mutation($input: PedidoDeliveryInput!) {
        crearPedidoDelivery(input: $input) {
          id
          estado
          total
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation, variables: { input } }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al crear pedido de delivery';
        throw new Error(errMsg);
      }

      return json.data.crearPedidoDelivery;
    } catch (err) {
      console.error('Error creating delivery order:', err);
      throw err;
    }
  },

  async obtenerPedidoDelivery(pedidoId: string): Promise<any> {
    const query = `
      query($id: ID!) {
        obtenerPedidoDelivery(id: $id) {
          id
          estado
          clienteId
          clienteNombre
          clienteTelefono
          direccionEntrega
          referencia
          latitud
          longitud
          subtotal
          total
          createdAt
          evidenciaUrl
          repartidorAsignado {
            id
            nombre
            coordenadasActuales
            telefono
          }
          detalles {
            id
            productoId
            nombreProducto
            cantidad
            precioUnitario
          }
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { id: pedidoId } }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener detalle del pedido';
        throw new Error(errMsg);
      }

      return json.data.obtenerPedidoDelivery;
    } catch (err) {
      console.error('Error fetching delivery order detail:', err);
      throw err;
    }
  },

  async obtenerPedidosDeliveryPorCliente(clienteId: string): Promise<any[]> {
    const query = `
      query($clienteId: ID!) {
        obtenerPedidosDeliveryPorCliente(clienteId: $clienteId) {
          id
          estado
          direccionEntrega
          subtotal
          total
          createdAt
          evidenciaUrl
          repartidorAsignado {
            id
            nombre
            telefono
          }
          detalles {
            id
            nombreProducto
            cantidad
            precioUnitario
          }
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { clienteId } }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener historial de pedidos';
        throw new Error(errMsg);
      }

      return json.data.obtenerPedidosDeliveryPorCliente;
    } catch (err) {
      console.error('Error fetching client delivery orders:', err);
      throw err;
    }
  },

  async obtenerPedidosDeliverySinAsignar(): Promise<any[]> {
    const query = `
      query {
        obtenerPedidosDeliverySinAsignar {
          id
          estado
          direccionEntrega
          total
          clienteId
          createdAt
          detalles {
            id
            nombreProducto
            cantidad
            precioUnitario
          }
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener pedidos sin asignar';
        throw new Error(errMsg);
      }

      return json.data.obtenerPedidosDeliverySinAsignar;
    } catch (err) {
      console.error('Error fetching unassigned delivery orders:', err);
      throw err;
    }
  },

  async obtenerPedidosPorRepartidor(repartidorId: string): Promise<any[]> {
    const query = `
      query($repartidorId: ID!) {
        obtenerPedidosPorRepartidor(repartidorId: $repartidorId) {
          id
          estado
          direccionEntrega
          total
          clienteId
          createdAt
          fechaCreacion
          fechaEntrega
          detalles {
            id
            nombreProducto
            cantidad
            precioUnitario
          }
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { repartidorId } }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener pedidos del repartidor';
        throw new Error(errMsg);
      }

      return json.data.obtenerPedidosPorRepartidor;
    } catch (err) {
      console.error('Error fetching driver delivery orders:', err);
      throw err;
    }
  },

  async asignarRepartidor(pedidoId: string, repartidorId: string): Promise<any> {
    const mutation = `
      mutation($pedidoId: ID!, $repartidorId: ID!) {
        asignarRepartidor(pedidoId: $pedidoId, repartidorId: $repartidorId) {
          id
          estado
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation, variables: { pedidoId, repartidorId } }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al asignar repartidor';
        throw new Error(errMsg);
      }

      return json.data.asignarRepartidor;
    } catch (err) {
      console.error('Error assigning driver:', err);
      throw err;
    }
  },

  async actualizarEstadoDelivery(pedidoId: string, estado: string): Promise<any> {
    const mutation = `
      mutation($pedidoId: ID!, $estado: EstadoDelivery!) {
        actualizarEstadoDelivery(pedidoId: $pedidoId, estado: $estado) {
          id
          estado
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation, variables: { pedidoId, estado } }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al actualizar estado del pedido';
        throw new Error(errMsg);
      }

      return json.data.actualizarEstadoDelivery;
    } catch (err) {
      console.error('Error updating delivery status:', err);
      throw err;
    }
  },

  async registrarPuntoClave(pedidoId: string, latitud: number, longitud: number, evento: string = 'EN_RUTA'): Promise<any> {
    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/api/v1/delivery/tracking/punto-clave`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pedidoId,
          latitud,
          longitud,
          evento,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Error al registrar telemetría GPS');
      }
      return json;
    } catch (err) {
      console.error('Error registering GPS telemetry:', err);
      throw err;
    }
  },

  async confirmarEntrega(pedidoId: string, imageUri: string): Promise<any> {
    try {
      if (!imageUri) {
        throw new Error('La imagen de evidencia es requerida');
      }

      const token = AuthService.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Utilizar la subida nativa de FileSystem para saltarse las limitaciones
      // de red del FormData de Javascript en Android
      const uploadResult = await FileSystem.uploadAsync(
        `${GATEWAY_URL}/api/v1/delivery/tracking/confirmar-entrega`,
        imageUri,
        {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.MULTIPART,
          headers,
          parameters: {
            pedidoId: pedidoId,
          },
        }
      );

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        let msg = 'Error al confirmar entrega con evidencia';
        try {
          const bodyJson = JSON.parse(uploadResult.body);
          msg = bodyJson.message || msg;
        } catch {}
        throw new Error(msg);
      }

      return JSON.parse(uploadResult.body);
    } catch (err) {
      console.error('Error confirming delivery with evidence:', err);
      throw err;
    }
  },

  async obtenerRepartidoresDisponibles(): Promise<any[]> {
    const query = `
      query {
        obtenerRepartidoresDisponibles {
          id
          nombre
          disponible
          coordenadasActuales
          telefono
        }
      }
    `;

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      if (!response.ok || json.errors) {
        const errMsg = json.errors?.[0]?.message || 'Error al obtener repartidores disponibles';
        throw new Error(errMsg);
      }

      return json.data.obtenerRepartidoresDisponibles;
    } catch (err) {
      console.error('Error fetching available drivers:', err);
      throw err;
    }
  }
};