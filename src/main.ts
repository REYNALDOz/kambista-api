import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/validate-env';
import { configureApp } from './configure-app';
import { setupSwagger } from './setup-swagger';

async function bootstrap() {
  await ConfigModule.envVariablesLoaded;
  validateEnv(process.env);

  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
