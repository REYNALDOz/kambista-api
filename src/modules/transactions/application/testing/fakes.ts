import { ExchangeRate } from '../../../exchange-rate/domain/exchange-rate';
import { TransactionRepository } from '../../domain/ports/transaction.repository';
import { Transaction } from '../../domain/transaction';

/** Keeps transactions in an array and assigns ids like a real database would. */
export class InMemoryTransactionRepository implements TransactionRepository {
  readonly transactions: Transaction[] = [];

  save(transaction: Transaction): Promise<Transaction> {
    const saved = Transaction.restore({
      id: `tx-${this.transactions.length + 1}`,
      userId: transaction.userId,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      convertedAmount: transaction.convertedAmount,
      appliedRate: transaction.appliedRate,
      date: transaction.date,
    });
    this.transactions.push(saved);
    return Promise.resolve(saved);
  }

  findByUser(userId: string, from: Date, to: Date): Promise<Transaction[]> {
    const found = this.transactions
      .filter((t) => t.userId === userId && t.date >= from && t.date <= to)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return Promise.resolve(found);
  }
}

/** SUNAT's example rate: buy 3.733, sell 3.739. */
export function aRate(): ExchangeRate {
  return ExchangeRate.create({
    buy: 3.733,
    sell: 3.739,
    source: 'SUNAT',
    currency: 'USD',
    date: '2024-01-18',
  });
}
