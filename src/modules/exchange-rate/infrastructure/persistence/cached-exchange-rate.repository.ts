import { ExchangeRate } from '../../domain/exchange-rate';
import { ExchangeRateRepository } from '../../domain/ports/exchange-rate.repository';

interface CachedRate {
  rate: ExchangeRate;
  cachedAt: number;
}

export class CachedExchangeRateRepository implements ExchangeRateRepository {
  private cached?: CachedRate;

  constructor(
    private readonly delegate: ExchangeRateRepository,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async save(rate: ExchangeRate): Promise<void> {
    // If saving fails, the error goes up and the previous cached rate stays.
    await this.delegate.save(rate);
    this.remember(rate);
  }

  async findLatest(): Promise<ExchangeRate | null> {
    if (this.cached && this.now() - this.cached.cachedAt < this.ttlMs) {
      return this.cached.rate;
    }
    const latest = await this.delegate.findLatest();
    // An empty result is never cached, so a rate saved a moment later is found.
    if (latest) {
      this.remember(latest);
    }
    return latest;
  }

  private remember(rate: ExchangeRate): void {
    this.cached = { rate, cachedAt: this.now() };
  }
}
