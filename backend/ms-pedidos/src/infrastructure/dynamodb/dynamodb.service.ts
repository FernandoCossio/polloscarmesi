import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly dbClient: DynamoDBClient | null = null;
  private readonly eventsTable: string;
  private readonly gpsTable: string;
  private readonly isMockMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.eventsTable = this.configService.get<string>('aws.dynamoDbEventsTable', 'polloscarmesi-events');
    this.gpsTable = this.configService.get<string>('aws.dynamoDbGpsTable', 'polloscarmesi-gps');

    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
    const region = this.configService.get<string>('aws.region');
    const endpointUrl = this.configService.get<string>('aws.endpointUrl');

    if (accessKeyId && secretAccessKey) {
      const clientConfig: any = {
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      if (endpointUrl) {
        clientConfig.endpoint = endpointUrl;
        this.logger.log(`Using custom DynamoDB endpoint: ${endpointUrl}`);
      }

      this.dbClient = new DynamoDBClient(clientConfig);
      this.isMockMode = false;
      this.logger.log('DynamoDB Client initialized successfully');
    } else {
      this.isMockMode = true;
      this.logger.log('DynamoDB running in LOCAL mock mode. Logs will write to disk/console.');
    }
  }

  async logEvent(pedidoId: string, eventName: string, payload: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const item = {
      id: `${pedidoId}-${timestamp}`,
      pedidoId,
      evento: eventName,
      timestamp,
      payload: JSON.stringify(payload),
    };

    if (!this.isMockMode && this.dbClient) {
      try {
        await this.dbClient.send(
          new PutItemCommand({
            TableName: this.eventsTable,
            Item: marshall(item),
          }),
        );
        this.logger.log(`Logged event to DynamoDB table ${this.eventsTable}: ${eventName} for Pedido ${pedidoId}`);
      } catch (err) {
        this.logger.error(`Error logging to DynamoDB events: ${err.message}`);
        this.writeLocalLog('events', item);
      }
    } else {
      this.writeLocalLog('events', item);
    }
  }

  async logGps(
    pedidoId: string,
    repartidorId: number,
    eventName: string,
    latitud: number,
    longitud: number,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const item = {
      id: `${pedidoId}-${repartidorId}-${timestamp}`,
      pedidoId,
      repartidorId,
      evento: eventName,
      latitud,
      longitud,
      timestamp,
    };

    if (!this.isMockMode && this.dbClient) {
      try {
        await this.dbClient.send(
          new PutItemCommand({
            TableName: this.gpsTable,
            Item: marshall(item),
          }),
        );
        this.logger.log(`Logged GPS tracking to DynamoDB table ${this.gpsTable}: ${eventName} for Pedido ${pedidoId}`);
      } catch (err) {
        this.logger.error(`Error logging to DynamoDB GPS: ${err.message}`);
        this.writeLocalLog('gps', item);
      }
    } else {
      this.writeLocalLog('gps', item);
    }
  }

  private writeLocalLog(type: 'events' | 'gps', data: any) {
    try {
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      
      const logFile = path.join(uploadDir, `dynamodb-mock-${type}.json`);
      let logs: any[] = [];
      
      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf8');
          logs = JSON.parse(content);
        } catch {
          logs = [];
        }
      }
      
      logs.push(data);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      this.logger.log(`[MOCK DYNAMODB][${type.toUpperCase()}] Saved to local file: ${JSON.stringify(data)}`);
    } catch (err) {
      this.logger.error(`Failed to write local mock log: ${err.message}`);
    }
  }
}
