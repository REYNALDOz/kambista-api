import { ExchangeRate } from '../../domain/exchange-rate';
import { ExchangeRateProvider } from '../../domain/ports/exchange-rate.provider';
import { ExchangeRateRepository } from '../../domain/ports/exchange-rate.repository';

/** Keeps the rates in an array; the last one saved is the latest. */
export class InMemoryExchangeRateRepository implements ExchangeRateRepository {
  readonly rates: ExchangeRate[] = [];

  save(rate: ExchangeRate): Promise<void> {
    this.rates.push(rate);
    return Promise.resolve();
  }

  findLatest(): Promise<ExchangeRate | null> {
    return Promise.resolve(this.rates[this.rates.length - 1] ?? null);
  }
}

/** Returns the rate it was given, or fails like a provider that is down. */
export class FakeExchangeRateProvider implements ExchangeRateProvider {
  constructor(private readonly result: ExchangeRate | Error) {}

  fetchCurrent(): Promise<ExchangeRate> {
    return this.result instanceof Error
      ? Promise.reject(this.result)
      : Promise.resolve(this.result);
  }
}

export function aRate(sell: number = 3.739): ExchangeRate {
  return ExchangeRate.create({
    buy: 3.733,
    sell,
    source: 'SUNAT',
    currency: 'USD',
    date: '2024-01-18',
  });
}
