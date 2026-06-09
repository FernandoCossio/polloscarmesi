import { GATEWAY_URL, AuthService } from './auth-service';

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
  }
};