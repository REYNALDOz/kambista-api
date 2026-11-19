import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from './shared/domain-exception.filter';

const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

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
  // The origin has no trailing slash: the browser sends it without one and CORS compares text.
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN });
}
