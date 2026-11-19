import { ExchangeRate } from '../../exchange-rate/domain/exchange-rate';
import { Transaction } from './transaction';
import { InvalidAmountError, SameCurrencyError } from './transaction.errors';

const rate = ExchangeRate.create({
  buy: 3.733,
  sell: 3.739,
  source: 'SUNAT',
  currency: 'USD',
  date: '2024-01-18',
});

describe('Transaction', () => {
  it('converts USD to PEN with the sell price', () => {
    const tx = Transaction.create({
      userId: 'u1',
      from: 'USD',
      to: 'PEN',
      amount: 100,
      rate,
    });

    expect(tx.convertedAmount.toNumber()).toBe(373.9);
    expect(tx.appliedRate.toNumber()).toBe(3.739);
  });

  it('converts PEN to USD with the buy price', () => {
    const tx = Transaction.create({
      userId: 'u1',
      from: 'PEN',
      to: 'USD',
      amount: 373.9,
      rate,
    });

    expect(tx.convertedAmount.toNumber()).toBe(100.16);
    expect(tx.appliedRate.toNumber()).toBe(3.733);
  });

  it('rounds the result to 2 decimals', () => {
    const tx = Transaction.create({
      userId: 'u1',
      from: 'PEN',
      to: 'USD',
      amount: 1,
      rate,
    });

    expect(tx.convertedAmount.toNumber()).toBe(0.27);
  });

  it('does not lose precision like floating point numbers do', () => {
    // In plain JavaScript, 100 * 3.739 is 373.90000000000003.
    const tx = Transaction.create({
      userId: 'u1',
      from: 'USD',
      to: 'PEN',
      amount: 100,
      rate,
    });

    expect(tx.convertedAmount.toString()).toBe('373.9');
  });

  it('rejects the same currency on both sides', () => {
    expect(() =>
      Transaction.create({
        userId: 'u1',
        from: 'USD',
        to: 'USD',
        amount: 100,
        rate,
      }),
    ).toThrow(SameCurrencyError);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the amount %s',
    (amount) => {
      expect(() =>
        Transaction.create({
          userId: 'u1',
          from: 'USD',
          to: 'PEN',
          amount,
          rate,
        }),
      ).toThrow(InvalidAmountError);
    },
  );
});
