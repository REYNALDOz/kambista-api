import { INestApplication, ValidationPipe } from '@nestjs/common';
import { parseCorsOrigins } from './config/cors-origins';
import { DomainExceptionFilter } from './shared/domain-exception.filter';

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
  app.enableCors({ origin: parseCorsOrigins(process.env.CORS_ORIGIN) });
}
