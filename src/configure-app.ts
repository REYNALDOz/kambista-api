import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseCorsOrigins } from './config/cors-origins';
import { DomainExceptionFilter } from './shared/domain-exception.filter';

const EXPOSED_HEADERS = ['X-Total-Count', 'X-Page', 'X-Limit', 'Retry-After'];

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableCors({
    origin: parseCorsOrigins(app.get(ConfigService).get<string>('CORS_ORIGIN')),
    // Without this, the browser hides these headers from the web app.
    exposedHeaders: EXPOSED_HEADERS,
  });
}
