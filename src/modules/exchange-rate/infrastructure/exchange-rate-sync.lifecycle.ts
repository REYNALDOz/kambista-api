import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeRateScheduler } from './exchange-rate.scheduler';

/**
 * Starts the scheduler with the app and stops it on shutdown.
 * The scheduler knows nothing about Nest; this class is the bridge.
 * Setting EXCHANGE_RATE_SYNC_ENABLED=false turns the synchronization off (useful in tests).
 */
@Injectable()
export class ExchangeRateSyncLifecycle
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly scheduler: ExchangeRateScheduler,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (this.config.get<string>('EXCHANGE_RATE_SYNC_ENABLED') !== 'false') {
      this.scheduler.start();
    }
  }

  onModuleDestroy(): void {
    this.scheduler.stop();
  }
}
