import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // CORS — tighten origins in production via env
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe: strip unknown properties & transform DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,          // strip properties not in DTO
      forbidNonWhitelisted: true, // throw on unknown properties
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Structured JSON request logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err: unknown) => {
  new Logger('Bootstrap').error('Fatal error during bootstrap', err);
  process.exit(1);
});
