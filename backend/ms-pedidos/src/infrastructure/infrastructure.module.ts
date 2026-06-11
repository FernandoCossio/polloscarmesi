import { Module, Global } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import { DynamoDbService } from './dynamodb/dynamodb.service';
import { RedisService } from './redis/redis.service';

@Global()
@Module({
  providers: [S3Service, DynamoDbService, RedisService],
  exports: [S3Service, DynamoDbService, RedisService],
})
export class InfrastructureModule {}
