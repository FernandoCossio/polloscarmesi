import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stitchSchemas } from '@graphql-tools/stitch';
import { wrapSchema, schemaFromExecutor } from '@graphql-tools/wrap';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';

@Injectable()
export class GatewayService implements OnModuleDestroy {
  private readonly logger = new Logger(GatewayService.name);
  private schema: GraphQLSchema;
  private pollInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    const Query = new GraphQLObjectType({
      name: 'Query',
      fields: {
        gatewayStatus: {
          type: GraphQLString,
          resolve: () => 'Gateway running...',
        },
      },
    });
    this.schema = new GraphQLSchema({ query: Query });
  }

  async initialize(): Promise<void> {
    let loaded = false;
    while (!loaded) {
      try {
        await this.loadSchemas();
        loaded = true;
      } catch (error) {
        this.logger.warn(`MS1 offline, reintentando en 3s... - ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    this.startSchemaPolling();
  }

  onModuleDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  async loadSchemas() {
    const ms1GraphqlUrl = this.configService.get<string>('microservices.ms1.graphqlUrl');
    const ms2GraphqlUrl = this.configService.get<string>('microservices.ms2.graphqlUrl');

    if (!ms1GraphqlUrl) throw new Error('MS1_GRAPHQL_URL is not configured');

    const subschemas: any[] = [];

    // Load MS1
    this.logger.log(`Conectando a MS1: ${ms1GraphqlUrl}`);
    const executor1 = buildHTTPExecutor({
      endpoint: ms1GraphqlUrl,
      headers: ({ context }: any) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (context?.req?.headers?.authorization) {
          headers['Authorization'] = context.req.headers.authorization;
        }
        return headers;
      },
    });
    try {
      const remoteSchema1 = await schemaFromExecutor(executor1);
      const wrappedSchema1 = wrapSchema({ schema: remoteSchema1, executor: executor1 });
      subschemas.push({ schema: wrappedSchema1, executor: executor1 });
      this.logger.log('MS1 schema cargado con éxito');
    } catch (error) {
      this.logger.error(`Error cargando MS1 schema: ${error.message}`);
      throw error;
    }

    // Load MS2
    if (ms2GraphqlUrl) {
      this.logger.log(`Conectando a MS2: ${ms2GraphqlUrl}`);
      const executor2 = buildHTTPExecutor({
        endpoint: ms2GraphqlUrl,
        headers: ({ context }: any) => {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (context?.req?.headers?.authorization) {
            headers['Authorization'] = context.req.headers.authorization;
          }
          return headers;
        },
      });
      try {
        const remoteSchema2 = await schemaFromExecutor(executor2);
        const wrappedSchema2 = wrapSchema({ schema: remoteSchema2, executor: executor2 });
        subschemas.push({ schema: wrappedSchema2, executor: executor2 });
        this.logger.log('MS2 schema cargado con éxito');
      } catch (error) {
        this.logger.error(`Error cargando MS2 schema: ${error.message}`);
        throw error;
      }
    }

    if (subschemas.length === 2 || (subschemas.length === 1 && !ms2GraphqlUrl)) {
      this.schema = stitchSchemas({
        subschemas,
        mergeTypes: true,
      });
      this.logger.log('Schemas stitched y actualizados.');
    } else {
      this.logger.warn('No se pudieron cargar todos los subschemas. Se mantiene el schema anterior.');
    }

    this.logger.debug(
      `Schema unificado listo. Queries disponibles: ${Object.keys(this.schema.getQueryType()?.getFields() ?? {})}`,
    );
  }

  private startSchemaPolling() {
    const interval = this.configService.get<number>('schemaPollInterval') || 30000;
    this.pollInterval = setInterval(async () => {
      try {
        await this.loadSchemas();
        this.logger.log('Schema recargado');
      } catch (error) {
        this.logger.warn(`Error recargando schema: ${error.message}`);
      }
    }, interval);
  }

  getSchema(): GraphQLSchema {
    return this.schema;
  }
}