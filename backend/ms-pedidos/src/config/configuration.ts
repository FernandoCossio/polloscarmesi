export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '0910',
    name: process.env.DB_NAME || 'pedidos',
    ssl: process.env.DB_SSL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName:
      process.env.AWS_S3_BUCKET_NAME || 'polloscarmesi-delivery-evidence',
    dynamoDbEventsTable:
      process.env.DYNAMODB_EVENTS_TABLE || 'polloscarmesi-events',
    dynamoDbGpsTable: process.env.DYNAMODB_GPS_TABLE || 'polloscarmesi-gps',
    storageType: process.env.STORAGE_TYPE || 'local',
    endpointUrl: process.env.AWS_ENDPOINT_URL || '',
  },
  ms1: {
    restInternalUrl:
      process.env.MS1_REST_INTERNAL_URL || 'http://localhost:8082/api',
  },
  ms3: {
    restInternalUrl:
      process.env.MS3_REST_INTERNAL_URL || 'http://localhost:3002/api',
  },
  n8n: {
    secret: process.env.N8N_SECRET || 'n8n_consolidated_secret_2026',
  },
  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN || '',
  },
  jwt: {
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || '../certs/public.pem',
  },
});
