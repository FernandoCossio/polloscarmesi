import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private isMockMode = false;
  private readonly mockEmitter = new EventEmitter();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    const password = this.configService.get<string>('redis.password', '');

    try {
      this.logger.log(`Connecting to Redis at ${host}:${port}...`);
      
      const redisOptions: any = {
        host,
        port,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null, // Do not retry continuously, fallback to mock if connect fails
      };

      if (password) {
        redisOptions.password = password;
      }

      this.pubClient = new Redis(redisOptions);
      this.subClient = new Redis(redisOptions);

      // Listen for connection error
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          this.pubClient!.on('connect', () => resolve());
          this.pubClient!.on('error', (err) => reject(err));
        }),
        new Promise<void>((resolve, reject) => {
          this.subClient!.on('connect', () => resolve());
          this.subClient!.on('error', (err) => reject(err));
        }),
      ]);

      this.logger.log('Redis Pub/Sub connected successfully.');
    } catch (err) {
      this.isMockMode = true;
      this.pubClient = null;
      this.subClient = null;
      this.logger.warn(`Redis connection failed (${err.message}). Falling back to LOCAL mock in-memory Pub/Sub.`);
    }
  }

  async onModuleDestroy() {
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }
  }

  async publish(channel: string, payload: any): Promise<void> {
    const messageStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    if (!this.isMockMode && this.pubClient) {
      try {
        await this.pubClient.publish(channel, messageStr);
        this.logger.log(`Published event to Redis channel [${channel}]`);
      } catch (err) {
        this.logger.error(`Error publishing to Redis: ${err.message}. Routing to in-memory fallback.`);
        this.mockEmitter.emit(channel, messageStr);
      }
    } else {
      this.logger.log(`[MOCK PUB] Published event to [${channel}] (In-Memory)`);
      this.mockEmitter.emit(channel, messageStr);
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.isMockMode && this.subClient) {
      try {
        await this.subClient.subscribe(channel);
        this.subClient.on('message', (chan, msg) => {
          if (chan === channel) {
            try {
              const parsed = JSON.parse(msg);
              callback(parsed);
            } catch {
              callback(msg);
            }
          }
        });
        this.logger.log(`Subscribed to Redis channel [${channel}]`);
      } catch (err) {
        this.logger.error(`Error subscribing to Redis: ${err.message}. Routing to in-memory fallback.`);
        this.subscribeMock(channel, callback);
      }
    } else {
      this.subscribeMock(channel, callback);
    }
  }

  private subscribeMock(channel: string, callback: (message: any) => void) {
    this.logger.log(`[MOCK SUB] Subscribed to [${channel}] (In-Memory)`);
    this.mockEmitter.on(channel, (msg: string) => {
      try {
        const parsed = JSON.parse(msg);
        callback(parsed);
      } catch {
        callback(msg);
      }
    });
  }
}
