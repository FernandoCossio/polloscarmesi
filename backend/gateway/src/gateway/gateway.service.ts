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
    if (!ms1GraphqlUrl) throw new Error('MS1_GRAPHQL_URL is not configured');

    this.logger.log(`Conectando a MS1: ${ms1GraphqlUrl}`);

    const executor = buildHTTPExecutor({
      endpoint: ms1GraphqlUrl,
      headers: ({ context }: any) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (context?.req?.headers?.authorization) {
          headers['Authorization'] = context.req.headers.authorization;
        }
        return headers;
      },
    });

    const remoteSchema = await schemaFromExecutor(executor);

    this.logger.debug(
      `Campos detectados en MS1: ${Object.keys(remoteSchema.getQueryType()?.getFields() ?? {})}`,
    );

    const wrappedSchema = wrapSchema({ schema: remoteSchema, executor });

    this.schema = stitchSchemas({
      subschemas: [{ schema: wrappedSchema, executor }],
    });

    this.logger.debug(
      `Schema listo: ${Object.keys(this.schema.getQueryType()?.getFields() ?? {})}`,
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