import { ExchangeRate } from '../domain/exchange-rate';
import { ExchangeRateProvider } from '../domain/ports/exchange-rate.provider';
import { ExchangeRateRepository } from '../domain/ports/exchange-rate.repository';

export class RefreshExchangeRateUseCase {
  constructor(
    private readonly provider: ExchangeRateProvider,
    private readonly repository: ExchangeRateRepository,
  ) {}

  async execute(): Promise<ExchangeRate> {
    const rate = await this.provider.fetchCurrent();
    await this.repository.save(rate);
    return rate;
  }
}
