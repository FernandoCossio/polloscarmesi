import * as fs from 'fs';
import * as path from 'path';

export default () => {
  // Read public key from file
  let publicKey = '';
  try {
    const publicKeyPath = process.env.MS4_JWT_PUBLIC_KEY_PATH || './certs/public.pem';
    // Resolve path relative to project root
    const fullPath = path.resolve(process.cwd(), publicKeyPath);
    publicKey = fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.warn('Warning: Could not read JWT public key file:', error);
  }
  
  return {
    port: parseInt(process.env.PORT || '4000', 10),
    ms4: {
      jwtPublicKey: publicKey,
      restUrl: process.env.MS4_REST_URL || 'http://localhost:8081/api',
    },
    microservices: {
      ms1: {
        graphqlUrl: process.env.MS1_GRAPHQL_URL || 'http://localhost:4001/graphql',
      },
      ms2: {
        graphqlUrl: process.env.MS2_GRAPHQL_URL || 'http://localhost:4002/graphql',
      },
      ms3: {
        graphqlUrl: process.env.MS3_GRAPHQL_URL || 'http://localhost:4003/graphql',
      },
    },
    schemaPollInterval: parseInt(process.env.SCHEMA_POLL_INTERVAL_MS || '30000', 10),
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      dynamoDbAuditTable: process.env.DYNAMODB_AUDIT_TABLE || 'polloscarmesi-audit',
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4200', 'http://localhost:3000'],
    },
  };
};
