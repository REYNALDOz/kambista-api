import { Decimal } from 'decimal.js';
import { ExchangeRate } from '../../exchange-rate/domain/exchange-rate';
import { InvalidAmountError, SameCurrencyError } from './transaction.errors';

export const CURRENCIES = ['USD', 'PEN'] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

const RESULT_DECIMAL_PLACES = 2;

interface CreateProps {
  userId: string;
  from: Currency;
  to: Currency;
  amount: Decimal.Value;
  rate: ExchangeRate;
  now?: Date;
}

interface RestoreProps {
  id: string;
  userId: string;
  from: Currency;
  to: Currency;
  amount: Decimal.Value;
  convertedAmount: Decimal.Value;
  appliedRate: Decimal.Value;
  date: Date;
}

export class Transaction {
  private constructor(
    public readonly id: string | undefined,
    public readonly userId: string,
    public readonly from: Currency,
    public readonly to: Currency,
    public readonly amount: Decimal,
    public readonly convertedAmount: Decimal,
    public readonly appliedRate: Decimal,
    public readonly date: Date,
  ) {}

  /** Creates a new transaction (not saved yet, so it has no id) and calculates the result. */
  static create({
    userId,
    from,
    to,
    amount,
    rate,
    now = new Date(),
  }: CreateProps): Transaction {
    if (from === to) {
      throw new SameCurrencyError();
    }
    const value = toPositiveAmount(amount);

    // USD -> PEN uses the sell price (amount * sell); PEN -> USD uses the buy price (amount / buy).
    const appliedRate = from === 'USD' ? rate.sell : rate.buy;
    const converted =
      from === 'USD' ? value.times(appliedRate) : value.div(appliedRate);

    return new Transaction(
      undefined,
      userId,
      from,
      to,
      value,
      converted.toDecimalPlaces(RESULT_DECIMAL_PLACES, Decimal.ROUND_HALF_UP),
      appliedRate,
      now,
    );
  }

  /** Rebuilds a transaction that was already saved. */
  static restore(props: RestoreProps): Transaction {
    return new Transaction(
      props.id,
      props.userId,
      props.from,
      props.to,
      new Decimal(props.amount),
      new Decimal(props.convertedAmount),
      new Decimal(props.appliedRate),
      props.date,
    );
  }
}

function toPositiveAmount(value: Decimal.Value): Decimal {
  let amount: Decimal;
  try {
    amount = new Decimal(value);
  } catch {
    throw new InvalidAmountError();
  }
  if (!amount.isFinite() || !amount.gt(0)) {
    throw new InvalidAmountError();
  }
  return amount;
}
