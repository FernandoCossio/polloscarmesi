import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private client: DynamoDBClient;
  private tableName: string;

  constructor(private readonly configService: ConfigService) {
    const region = configService.get<string>('aws.region')!;
    const accessKeyId = configService.get<string>('aws.accessKeyId')!;
    const secretAccessKey = configService.get<string>('aws.secretAccessKey')!;
    this.tableName = configService.get<string>('aws.dynamoDbAuditTable')!;
    
    this.client = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async logAuditEvent(event: {
    timestamp: Date;
    userId?: string;
    role?: string;
    operationName?: string;
    operationType?: string;
    statusCode?: number;
    ip?: string;
    eventType: string;
  }) {
    const item = marshall({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      ...event,
      timestamp: event.timestamp.toISOString(),
    });

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: item,
    });

    try {
      await this.client.send(command);
    } catch (error) {
      this.logger.error('Error logging audit event:', error.stack);
    }
  }
}
