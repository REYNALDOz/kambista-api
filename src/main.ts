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
void bootstrap();
