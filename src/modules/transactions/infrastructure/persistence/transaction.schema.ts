import { Schema, Types } from 'mongoose';
import { CURRENCIES } from '../../domain/transaction';

export interface TransactionDocument {
  userId: string;
  from: string;
  to: string;
  amount: Types.Decimal128;
  convertedAmount: Types.Decimal128;
  appliedRate: Types.Decimal128;
  date: Date;
}

export const TransactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: String, required: true },
    from: { type: String, enum: CURRENCIES, required: true },
    to: { type: String, enum: CURRENCIES, required: true },
    // Decimal128 keeps money exact; plain numbers would lose precision.
    amount: { type: Schema.Types.Decimal128, required: true },
    convertedAmount: { type: Schema.Types.Decimal128, required: true },
    appliedRate: { type: Schema.Types.Decimal128, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true, collection: 'transactions' },
);

// The history is always queried by user and date range.
TransactionSchema.index({ userId: 1, date: -1 });
