import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetLatestExchangeRateUseCase } from './application/get-latest-exchange-rate.use-case';
import { RefreshExchangeRateUseCase } from './application/refresh-exchange-rate.use-case';
import { ExchangeRateProvider } from './domain/ports/exchange-rate.provider';
import { ExchangeRateRepository } from './domain/ports/exchange-rate.repository';
import {
  EXCHANGE_RATE_PROVIDER,
  EXCHANGE_RATE_REPOSITORY,
} from './exchange-rate.tokens';
import { ExchangeRateSyncLifecycle } from './infrastructure/exchange-rate-sync.lifecycle';
import { ExchangeRateScheduler } from './infrastructure/exchange-rate.scheduler';
import { CachedExchangeRateRepository } from './infrastructure/persistence/cached-exchange-rate.repository';
import { MongoExchangeRateRepository } from './infrastructure/persistence/mongo-exchange-rate.repository';
import {
  ExchangeRateDocument,
  ExchangeRateSchema,
} from './infrastructure/persistence/exchange-rate.schema';
import { SunatExchangeRateProvider } from './infrastructure/sunat-exchange-rate.provider';

const MODEL_NAME = 'ExchangeRate';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_REFRESH_MS = 30_000;
const DEFAULT_CACHE_TTL_MS = 60_000;

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MODEL_NAME, schema: ExchangeRateSchema },
    ]),
  ],
  providers: [
    {
      provide: EXCHANGE_RATE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new SunatExchangeRateProvider(
          config.getOrThrow<string>('EXCHANGE_RATE_API_URL'),
          Number(config.get('EXCHANGE_RATE_TIMEOUT_MS', DEFAULT_TIMEOUT_MS)),
        ),
    },
    {
      provide: EXCHANGE_RATE_REPOSITORY,
      inject: [getModelToken(MODEL_NAME), ConfigService],
      useFactory: (model: Model<ExchangeRateDocument>, config: ConfigService) =>
        new CachedExchangeRateRepository(
          new MongoExchangeRateRepository(model),
          Number(
            config.get('EXCHANGE_RATE_CACHE_TTL_MS', DEFAULT_CACHE_TTL_MS),
          ),
        ),
    },
    {
      provide: RefreshExchangeRateUseCase,
      inject: [EXCHANGE_RATE_PROVIDER, EXCHANGE_RATE_REPOSITORY],
      useFactory: (
        provider: ExchangeRateProvider,
        repository: ExchangeRateRepository,
      ) => new RefreshExchangeRateUseCase(provider, repository),
    },
    {
      provide: GetLatestExchangeRateUseCase,
      inject: [EXCHANGE_RATE_REPOSITORY],
      useFactory: (repository: ExchangeRateRepository) =>
        new GetLatestExchangeRateUseCase(repository),
    },
    {
      provide: ExchangeRateScheduler,
      inject: [RefreshExchangeRateUseCase, ConfigService],
      useFactory: (
        useCase: RefreshExchangeRateUseCase,
        config: ConfigService,
      ) =>
        new ExchangeRateScheduler(
          useCase,
          Number(config.get('EXCHANGE_RATE_REFRESH_MS', DEFAULT_REFRESH_MS)),
          new Logger(ExchangeRateScheduler.name),
        ),
    },
    ExchangeRateSyncLifecycle,
  ],
  exports: [GetLatestExchangeRateUseCase],
})
export class ExchangeRateModule {}
