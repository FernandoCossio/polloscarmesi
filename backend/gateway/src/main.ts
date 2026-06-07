import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  
  // Habilitar validación de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Configurar CORS
  const corsOrigins = configService.get<string[]>('cors.origins') || [];
  app.enableCors({
    origin: corsOrigins,
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
