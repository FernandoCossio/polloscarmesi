import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Ms1GraphqlClient {
  private readonly logger = new Logger(Ms1GraphqlClient.name);
  private readonly graphqlUrl: string;

  constructor(private readonly configService: ConfigService) {
    // If REST internal URL is http://localhost:8082/api, then GraphQL is http://localhost:8082/api/graphql
    const restUrl = this.configService.get<string>(
      'ms1.restInternalUrl',
      'http://localhost:8082/api',
    );
    this.graphqlUrl = `${restUrl}/graphql`;
  }

  async obtenerPedidosPorFecha(fecha: string): Promise<any[]> {
    const query = `
      query($fecha: String!) {
        obtenerPedidosPorFecha(fecha: $fecha) {
          id
          subtotal
          descuento
          total
          tipo
          estado
        }
      }
    `;

    try {
      this.logger.log(
        `Querying MS1 GraphQL at ${this.graphqlUrl} for date: ${fecha}...`,
      );
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables: { fecha } }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || 'GraphQL error');
      }

      return json.data?.obtenerPedidosPorFecha || [];
    } catch (err) {
      this.logger.error(
        `Failed to fetch orders from MS1: ${err.message}. Returning fallback mock data.`,
      );
      // Return dev mock data to prevent hard lock if MS1 is down
      return [
        {
          id: '1',
          subtotal: 150.0,
          descuento: 0.0,
          total: 150.0,
          tipo: 'PRESENCIAL',
          estado: 'ENTREGADO',
        },
        {
          id: '2',
          subtotal: 85.0,
          descuento: 5.0,
          total: 80.0,
          tipo: 'PRESENCIAL',
          estado: 'ENTREGADO',
        },
      ];
    }
  }

  async obtenerMenu(authHeader?: string): Promise<any[]> {
    const query = `
      query {
        obtenerMenu {
          id
          nombre
          descripcion
          precio
          disponible
        }
      }
    `;

    try {
      this.logger.log(`Querying MS1 GraphQL at ${this.graphqlUrl} for menu...`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || 'GraphQL error');
      }

      return json.data?.obtenerMenu || [];
    } catch (err) {
      this.logger.error(
        `Failed to fetch menu from MS1: ${err.message}. Returning fallback menu.`,
      );
      return [
        {
          id: '1',
          nombre: '1/4 Pollo a la Brasa',
          descripcion:
            'Un cuarto de pollo tierno y jugoso con papas fritas y ensalada fresca. Ideal para una persona.',
          precio: 25.0,
          disponible: true,
        },
        {
          id: '2',
          nombre: '1/2 Pollo a la Brasa',
          descripcion:
            'Medio pollo dorado a la brasa con porción grande de papas fritas y ensalada. Perfecto para dos personas.',
          precio: 45.0,
          disponible: true,
        },
        {
          id: '3',
          nombre: '1 Pollo Entero a la Brasa',
          descripcion:
            'Un delicioso pollo entero a la brasa con papas fritas familiares, ensalada y salsas de la casa.',
          precio: 80.0,
          disponible: true,
        },
        {
          id: '4',
          nombre: 'Combo Familiar Carmesí',
          descripcion:
            'Un pollo entero, porción doble de papas fritas, arroz con queso, ensalada grande y gaseosa de 2 Litros.',
          precio: 95.0,
          disponible: true,
        },
        {
          id: '5',
          nombre: 'Gaseosa Coca-Cola 2L',
          descripcion: 'Gaseosa refrescante familiar de 2 Litros.',
          precio: 12.0,
          disponible: true,
        },
      ];
    }
  }
}
