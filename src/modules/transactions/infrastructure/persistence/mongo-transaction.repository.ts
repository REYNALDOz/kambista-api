import { Model } from 'mongoose';
import { TransactionRepository } from '../../domain/ports/transaction.repository';
import { isCurrency, Transaction } from '../../domain/transaction';
import { TransactionDocument } from './transaction.schema';

type StoredTransaction = TransactionDocument & {
  _id: { toString(): string };
};

/** Translates between Mongo documents and the domain `Transaction`. */
export class MongoTransactionRepository implements TransactionRepository {
  constructor(private readonly model: Model<TransactionDocument>) {}

  async save(transaction: Transaction): Promise<Transaction> {
    const created = await this.model.create({
      userId: transaction.userId,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount.toFixed(),
      convertedAmount: transaction.convertedAmount.toFixed(),
      appliedRate: transaction.appliedRate.toFixed(),
      date: transaction.date,
    });
    return this.toDomain(created.toObject() as StoredTransaction);
  }

  async findByUser(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Transaction[]> {
    const documents = await this.model
      .find({ userId, date: { $gte: from, $lte: to } })
      .sort({ date: -1, _id: -1 })
      .lean<StoredTransaction[]>();
    return documents.map((document) => this.toDomain(document));
  }

  private toDomain(document: StoredTransaction): Transaction {
    // Data coming from outside the domain is validated before it becomes a Currency.
    if (!isCurrency(document.from) || !isCurrency(document.to)) {
      throw new Error(
        `Transaction ${document._id.toString()} has an unknown currency`,
      );
    }

    return Transaction.restore({
      id: document._id.toString(),
      userId: document.userId,
      from: document.from,
      to: document.to,
      amount: document.amount.toString(),
      convertedAmount: document.convertedAmount.toString(),
      appliedRate: document.appliedRate.toString(),
      date: document.date,
    });
  }
}
