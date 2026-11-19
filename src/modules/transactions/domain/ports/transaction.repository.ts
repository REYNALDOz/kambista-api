import { Transaction } from '../transaction';

export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  /** The user's transactions between two dates (both included), newest first. */
  findByUser(userId: string, from: Date, to: Date): Promise<Transaction[]>;
}
