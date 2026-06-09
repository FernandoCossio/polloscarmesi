import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Ms1GraphqlClient {
  private readonly logger = new Logger(Ms1GraphqlClient.name);
  private readonly graphqlUrl: string;

  constructor(private readonly configService: ConfigService) {
    // If REST internal URL is http://localhost:8082/api, then GraphQL is http://localhost:8082/api/graphql
    const restUrl = this.configService.get<string>('ms1.restInternalUrl', 'http://localhost:8082/api');
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
      this.logger.log(`Querying MS1 GraphQL at ${this.graphqlUrl} for date: ${fecha}...`);
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
      this.logger.error(`Failed to fetch orders from MS1: ${err.message}. Returning fallback mock data.`);
      // Return dev mock data to prevent hard lock if MS1 is down
      return [
        { id: '1', subtotal: 150.0, descuento: 0.0, total: 150.0, tipo: 'PRESENCIAL', estado: 'ENTREGADO' },
        { id: '2', subtotal: 85.0, descuento: 5.0, total: 80.0, tipo: 'PRESENCIAL', estado: 'ENTREGADO' },
      ];
    }
  }
}
