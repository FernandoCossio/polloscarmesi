import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stitchSchemas } from '@graphql-tools/stitch';
import { wrapSchema, schemaFromExecutor } from '@graphql-tools/wrap';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';
import { InternalServiceAuthService } from '../auth-rest/internal-service-auth.service';

@Injectable()
export class GatewayService implements OnModuleDestroy {
  private readonly logger = new Logger(GatewayService.name);
  private schema: GraphQLSchema;
  private pollInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly internalServiceAuthService: InternalServiceAuthService,
  ) {
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
        this.logger.warn(
          `Algún microservicio GraphQL está desconectado. Reintentando en 3s... - ${error.message}`,
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    this.startSchemaPolling();
  }

  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async loadSchemas() {
    const ms1GraphqlUrl = this.configService.get<string>(
      'microservices.ms1.graphqlUrl',
    );

    const msiaGraphqlUrl = this.configService.get<string>(
      'microservices.msia.graphqlUrl',
    );

    if (!ms1GraphqlUrl) {
      throw new Error('MS1_GRAPHQL_URL is not configured');
    }

    if (!msiaGraphqlUrl) {
      throw new Error('MSIA_GRAPHQL_URL is not configured');
    }

    this.logger.log(`Conectando a MS1: ${ms1GraphqlUrl}`);
    this.logger.log(`Conectando a MS-IA: ${msiaGraphqlUrl}`);

    const internalAuthorizationHeader =
      await this.internalServiceAuthService.getAuthorizationHeader();

    const crearExecutor = (endpoint: string) =>
      buildHTTPExecutor({
        endpoint,
        headers: ({ context }: any) => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (context?.req?.headers?.authorization) {
            headers['Authorization'] = context.req.headers.authorization;
            return headers;
          }

          if (!context?.req) {
            headers['Authorization'] =
              internalAuthorizationHeader;
          }

          return headers;
        },
      });

    const ms1Executor = crearExecutor(ms1GraphqlUrl);
    const msiaExecutor = crearExecutor(msiaGraphqlUrl);

    const [ms1RemoteSchema, msiaRemoteSchema] = await Promise.all([
      schemaFromExecutor(ms1Executor),
      schemaFromExecutor(msiaExecutor),
    ]);

    this.logger.debug(
      `Campos detectados en MS1: ${Object.keys(
        ms1RemoteSchema.getQueryType()?.getFields() ?? {},
      )}`,
    );

    this.logger.debug(
      `Consultas detectadas en MS-IA: ${Object.keys(
        msiaRemoteSchema.getQueryType()?.getFields() ?? {},
      )}`,
    );

    this.logger.debug(
      `Mutaciones detectadas en MS-IA: ${Object.keys(
        msiaRemoteSchema.getMutationType()?.getFields() ?? {},
      )}`,
    );

    const ms1WrappedSchema = wrapSchema({
      schema: ms1RemoteSchema,
      executor: ms1Executor,
    });

    const msiaWrappedSchema = wrapSchema({
      schema: msiaRemoteSchema,
      executor: msiaExecutor,
    });

    this.schema = stitchSchemas({
      subschemas: [
        {
          schema: ms1WrappedSchema,
          executor: ms1Executor,
        },
        {
          schema: msiaWrappedSchema,
          executor: msiaExecutor,
        },
      ],
    });

    this.logger.debug(
      `Schema listo: ${Object.keys(
        this.schema.getQueryType()?.getFields() ?? {},
      )}`,
    );
  }

  private startSchemaPolling() {
    const interval =
      this.configService.get<number>('schemaPollInterval') || 30000;

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
