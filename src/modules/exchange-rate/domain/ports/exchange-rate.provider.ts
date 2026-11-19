import { ExchangeRate } from '../exchange-rate';

export interface ExchangeRateProvider {
  fetchCurrent(): Promise<ExchangeRate>;
}
