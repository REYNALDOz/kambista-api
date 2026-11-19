import { ExchangeRate } from '../domain/exchange-rate';
import { ExchangeRateNotAvailableError } from '../domain/exchange-rate.errors';
import { ExchangeRateRepository } from '../domain/ports/exchange-rate.repository';

export class GetLatestExchangeRateUseCase {
  constructor(private readonly repository: ExchangeRateRepository) {}

  async execute(): Promise<ExchangeRate> {
    const rate = await this.repository.findLatest();
    if (!rate) {
      throw new ExchangeRateNotAvailableError();
    }
    return rate;
  }
}
