import { Decimal } from 'decimal.js';
import { InvalidExchangeRateError } from './exchange-rate.errors';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ExchangeRateProps {
  buy: Decimal.Value;
  sell: Decimal.Value;
  source: string;
  currency: string;
  date: string;
}

export class ExchangeRate {
  private constructor(
    public readonly buy: Decimal,
    public readonly sell: Decimal,
    public readonly source: string,
    public readonly currency: string,
    public readonly date: string,
  ) {}

  static create(props: ExchangeRateProps): ExchangeRate {
    return new ExchangeRate(
      toPositiveDecimal(props.buy, 'buy'),
      toPositiveDecimal(props.sell, 'sell'),
      props.source,
      props.currency,
      validDate(props.date),
    );
  }
}

function toPositiveDecimal(value: Decimal.Value, field: string): Decimal {
  let decimal: Decimal;
  try {
    decimal = new Decimal(value);
  } catch {
    throw new InvalidExchangeRateError(`${field} is not a number`);
  }
  if (!decimal.isFinite() || !decimal.gt(0)) {
    throw new InvalidExchangeRateError(`${field} must be a positive number`);
  }
  return decimal;
}

function validDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  const isRealDate =
    DATE_PATTERN.test(date) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().startsWith(date);
  if (!isRealDate) {
    throw new InvalidExchangeRateError('date must be a valid YYYY-MM-DD');
  }
  return date;
}
