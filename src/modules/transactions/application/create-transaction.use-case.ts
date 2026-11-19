import { ExchangeRate } from '../../exchange-rate/domain/exchange-rate';
import { TransactionRepository } from '../domain/ports/transaction.repository';
import { Currency, Transaction } from '../domain/transaction';

/** What this use case needs from the exchange rate module: the latest saved rate. */
export interface LatestRateQuery {
  execute(): Promise<ExchangeRate>;
}

export interface CreateTransactionInput {
  userId: string;
  from: Currency;
  to: Currency;
  amount: number;
}

export class CreateTransactionUseCase {
  constructor(
    private readonly latestRate: LatestRateQuery,
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    // Fails with ExchangeRateNotAvailableError when no rate has been registered yet.
    const rate = await this.latestRate.execute();

    const transaction = Transaction.create({
      userId: input.userId,
      from: input.from,
      to: input.to,
      amount: input.amount,
      rate,
    });
    return this.transactions.save(transaction);
  }
}
