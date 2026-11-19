import { Model } from 'mongoose';
import { Page, PageRequest, TransactionRepository } from '../../domain/ports/transaction.repository';
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
    { page, limit }: PageRequest,
  ): Promise<Page<Transaction>> {
    const filter = { userId, date: { $gte: from, $lte: to } };
    const [documents, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ date: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<StoredTransaction[]>(),
      this.model.countDocuments(filter),
    ]);
    return { items: documents.map((d) => this.toDomain(d)), total };
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
