import { Model, Types } from 'mongoose';

import { ExchangeRateDocument } from './exchange-rate.schema';
import { ExchangeRateRepository } from '../../domain/ports/exchange-rate.repository';
import { ExchangeRate } from '../../domain/exchange-rate';

export class MongoExchangeRateRepository implements ExchangeRateRepository {
  constructor(private readonly model: Model<ExchangeRateDocument>) {}

  async save(rate: ExchangeRate): Promise<void> {
    await this.model.create({
      buy: Types.Decimal128.fromString(rate.buy.toFixed()),
      sell: Types.Decimal128.fromString(rate.sell.toFixed()),
      source: rate.source,
      currency: rate.currency,
      date: rate.date,
    });
  }

  async findLatest(): Promise<ExchangeRate | null> {
    const doc = await this.model
      .findOne()
      .sort({ createdAt: -1, _id: -1 })
      .lean<ExchangeRateDocument>();

    return doc
      ? ExchangeRate.create({
          buy: doc.buy.toString(),
          sell: doc.sell.toString(),
          source: doc.source,
          currency: doc.currency,
          date: doc.date,
        })
      : null;
  }
}
