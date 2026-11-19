import { ExchangeRate } from '../domain/exchange-rate';

export interface Refresher {
  execute(): Promise<ExchangeRate>;
}

export interface SchedulerLogger {
  log(message: string): void;
  error(message: string): void;
}

export class ExchangeRateScheduler {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly refresher: Refresher,
    private readonly intervalMs: number,
    private readonly logger: SchedulerLogger,
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const rate = await this.refresher.execute();
      this.logger.log(
        `Exchange rate updated: buy ${rate.buy.toString()} / sell ${rate.sell.toString()}`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Exchange rate refresh failed: ${reason}`);
    } finally {
      this.running = false;
    }
  }
}
