import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { GatewayService } from './gateway.service';

export function createGatewayPlugin(gatewayService: GatewayService): ApolloServerPlugin {
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async willSendResponse(requestContext) {
          // Optional: Add any request lifecycle logic here
        },
      };
    },
  };
}
