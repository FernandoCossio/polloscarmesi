import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  const base64UrlToBuffer = (input: string): Buffer => {
    const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return Buffer.from(base64, 'base64');
  };

  const parseJwtJsonPart = (part: string): any => {
    const json = base64UrlToBuffer(part).toString('utf8');
    return JSON.parse(json);
  };

  const getJwtUserFromAuthorizationHeader = (authorizationHeader: unknown) => {
    if (typeof authorizationHeader !== 'string') return undefined;
    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return undefined;

    const token = match[1].trim();
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;

    const [headerPart, payloadPart, signaturePart] = parts;

    let header: any;
    let payload: any;
    try {
      header = parseJwtJsonPart(headerPart);
      payload = parseJwtJsonPart(payloadPart);
    } catch {
      return undefined;
    }

    const alg = typeof header?.alg === 'string' ? header.alg : undefined;
    const publicKeyPem = configService.get<string>('ms4.jwtPublicKey') || '';

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload?.exp === 'number' && nowSeconds >= payload.exp) return undefined;
    if (typeof payload?.nbf === 'number' && nowSeconds < payload.nbf) return undefined;

    if (publicKeyPem.trim().length === 0) return undefined;
    if (alg !== 'RS256' && alg !== 'RS512') return undefined;

    const data = `${headerPart}.${payloadPart}`;
    const signature = base64UrlToBuffer(signaturePart);

    let ok = false;
    try {
      const key = crypto.createPublicKey(publicKeyPem);
      ok = crypto.verify(
        alg === 'RS256' ? 'RSA-SHA256' : 'RSA-SHA512',
        Buffer.from(data, 'utf8'),
        key,
        signature,
      );
    } catch {
      ok = false;
    }

    if (!ok) return undefined;

    const roles = Array.isArray(payload?.roles) ? payload.roles.filter((r: any) => typeof r === 'string') : [];
    const role =
      typeof payload?.role === 'string'
        ? payload.role
        : roles.length > 0
          ? roles[0]
          : undefined;

    const userId =
      typeof payload?.userId === 'string'
        ? payload.userId
        : typeof payload?.sub === 'string'
          ? payload.sub
          : typeof payload?.username === 'string'
            ? payload.username
            : undefined;

    if (!userId && !role) return undefined;

    return { userId, role, roles };
  };
  
  // Habilitar validación de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.use((req: any, _res: any, next: any) => {
    try {
      const user = getJwtUserFromAuthorizationHeader(req?.headers?.authorization);
      if (user) req.user = user;
    } catch {
    }
    next();
  });
  
  // Configurar CORS
  const corsOrigins = configService.get<string[]>('cors.origins') || [];
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });

  // Configurar Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pollos Carmesi - Gateway API')
    .setDescription('API Gateway que sirve como punto de entrada único para todos los microservicios')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('port') || 4000;
  await app.listen(port);
  logger.log(`Gateway is running on http://localhost:${port}`);
  logger.log(`GraphQL Playground: http://localhost:${port}/graphql`);
  logger.log(`Swagger UI: http://localhost:${port}/api`);
}
bootstrap();
