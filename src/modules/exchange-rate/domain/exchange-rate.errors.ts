export class InvalidExchangeRateError extends Error {
  constructor(reason: string) {
    super(`Invalid exchange rate: ${reason}`);
    this.name = 'InvalidExchangeRateError';
  }
}
export class ExchangeRateNotAvailableError extends Error {
  constructor() {
    super('There is no exchange rate registered yet');
    this.name = 'ExchangeRateNotAvailableError';
  }
}
export class ExchangeRateUnavailableError extends Error {
  constructor(reason: string) {
    super(`Exchange rate is unavailable: ${reason}`);
    this.name = 'ExchangeRateUnavailableError';
  }
}
