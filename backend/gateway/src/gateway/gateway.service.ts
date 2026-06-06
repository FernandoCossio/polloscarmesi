import { Injectable, OnModuleInit, OnModuleDestroy, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { stitchSchemas } from '@graphql-tools/stitch';
import { wrapSchema } from '@graphql-tools/wrap';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { GraphQLSchema } from 'graphql';

// Import introspectSchema with type assertion
const { introspectSchema } = require('@graphql-tools/wrap') as any;

@Injectable()
export class GatewayService implements OnModuleInit, OnModuleDestroy {
  private schema: GraphQLSchema;
  private pollInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.loadSchemas();
    this.startSchemaPolling();
  }

  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private async loadSchemas() {
    const ms1GraphqlUrl = this.configService.get<string>('microservices.ms1.graphqlUrl');
    if (!ms1GraphqlUrl) {
      throw new InternalServerErrorException('MS1_GRAPHQL_URL is not configured');
    }

    // Create executor with type assertion to bypass TypeScript checks
    const executor = buildHTTPExecutor({
      endpoint: ms1GraphqlUrl,
      // @ts-ignore
      headers: ({ context }: any) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (context?.req?.headers?.authorization) {
          headers['Authorization'] = context.req.headers.authorization;
        }
        
        return headers;
      },
    }) as any;

    const schema = await introspectSchema(executor);

    const remoteSchema = wrapSchema({
      schema,
      executor,
    });

    this.schema = stitchSchemas({
      subschemas: [remoteSchema],
    });
  }

  private startSchemaPolling() {
    const interval = this.configService.get<number>('schemaPollInterval') || 30000;
    this.pollInterval = setInterval(async () => {
      try {
        await this.loadSchemas();
      } catch (error) {
        console.error('Error reloading schemas:', error);
      }
    }, interval);
  }

  getSchema(): GraphQLSchema {
    return this.schema;
  }
}
