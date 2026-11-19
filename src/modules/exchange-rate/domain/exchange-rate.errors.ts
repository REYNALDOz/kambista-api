export class InvalidExchangeRateError extends Error {
  constructor(reason: string) {
    super(`Invalid exchange rate: ${reason}`);
    this.name = 'InvalidExchangeRateError';
  }
}
