import { Schema, Types } from 'mongoose';

export interface ExchangeRateDocument {
  buy: Types.Decimal128;
  sell: Types.Decimal128;
  source: string;
  currency: string;
  date: string;
}

export const ExchangeRateSchema = new Schema<ExchangeRateDocument>(
  {
    buy: { type: Schema.Types.Decimal128, required: true },
    sell: { type: Schema.Types.Decimal128, required: true },
    source: { type: String, required: true },
    currency: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true, collection: 'exchange_rates' },
);

ExchangeRateSchema.index({ createdAt: -1, _id: -1 });
