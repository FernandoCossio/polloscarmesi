import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private client?: DynamoDBClient;
  private tableName?: string;
  private readonly requestTimeoutMs = 2000;

  constructor(private readonly configService: ConfigService) {
    const region = configService.get<string>('aws.region');
    const endpoint = configService.get<string>('aws.endpoint');
    const accessKeyId = configService.get<string>('aws.accessKeyId');
    const secretAccessKey = configService.get<string>('aws.secretAccessKey');
    this.tableName = configService.get<string>('aws.dynamoDbAuditTable');

    if (!this.tableName) {
      this.logger.error('DYNAMODB_AUDIT_TABLE no está configurada; se desactiva el log de auditoría hacia DynamoDB.');
      return;
    }

    if (!region) {
      this.logger.error('AWS_REGION no está configurada; se desactiva el log de auditoría hacia DynamoDB.');
      return;
    }

    const hasStaticCredentials = Boolean(accessKeyId && secretAccessKey);

    if (!hasStaticCredentials) {
      this.logger.warn(
        'AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY no están configuradas; DynamoDB usará el provider chain por defecto (si existe).',
      );
    }

    this.client = new DynamoDBClient(
      {
        region,
        endpoint: endpoint ? endpoint : undefined,
        credentials: hasStaticCredentials
          ? {
              accessKeyId: accessKeyId!,
              secretAccessKey: secretAccessKey!,
            }
          : undefined,
        requestTimeout: this.requestTimeoutMs,
      } as any,
    );
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
    try {
      if (!this.client || !this.tableName) {
        throw new Error('AuditService no está configurado para DynamoDB.');
      }

      const item = marshall(
        {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          ...event,
          timestamp: event.timestamp.toISOString(),
        },
        { removeUndefinedValues: true },
      );

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: item,
      });

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.requestTimeoutMs);
      try {
        await this.client.send(command, { abortSignal: abortController.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error al registrar evento de auditoría en DynamoDB', stack);
      console.log(event);
    }
  }
}
