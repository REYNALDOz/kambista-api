import { ExchangeRate } from '../exchange-rate';

export interface ExchangeRateRepository {
  save(rate: ExchangeRate): Promise<void>;
  findLatest(): Promise<ExchangeRate | null>;
}
