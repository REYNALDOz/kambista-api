import { InvalidExchangeRateError } from './exchange-rate.errors';
import { ExchangeRate } from './exchange-rate';

const validProps = {
  buy: 3.733,
  sell: 3.739,
  source: 'SUNAT',
  currency: 'USD',
  date: '2024-01-18',
};

describe('ExchangeRate', () => {
  it('creates a rate from valid data', () => {
    const rate = ExchangeRate.create(validProps);

    expect(rate.buy.toNumber()).toBe(3.733);
    expect(rate.sell.toNumber()).toBe(3.739);
    expect(rate.currency).toBe('USD');
    expect(rate.date).toBe('2024-01-18');
  });

  it('accepts prices as text, like the ones that come from an API', () => {
    const rate = ExchangeRate.create({ ...validProps, buy: '3.733' });

    expect(rate.buy.toNumber()).toBe(3.733);
  });

  it.each([0, -1])('rejects a price of %s', (price) => {
    expect(() => ExchangeRate.create({ ...validProps, buy: price })).toThrow(
      InvalidExchangeRateError,
    );
    expect(() => ExchangeRate.create({ ...validProps, sell: price })).toThrow(
      InvalidExchangeRateError,
    );
  });

  it('rejects a price that is not a number', () => {
    expect(() => ExchangeRate.create({ ...validProps, sell: 'abc' })).toThrow(
      'sell is not a number',
    );
  });

  it.each(['2024-02-31', '18/01/2024', ''])('rejects the date "%s"', (date) => {
    expect(() => ExchangeRate.create({ ...validProps, date })).toThrow(
      InvalidExchangeRateError,
    );
  });
});
