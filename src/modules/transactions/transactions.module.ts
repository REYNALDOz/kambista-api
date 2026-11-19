import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetLatestExchangeRateUseCase } from '../exchange-rate/application/get-latest-exchange-rate.use-case';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { GetHistoryUseCase } from './application/get-history.use-case';
import { TransactionRepository } from './domain/ports/transaction.repository';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { MongoTransactionRepository } from './infrastructure/persistence/mongo-transaction.repository';
import {
  TransactionDocument,
  TransactionSchema,
} from './infrastructure/persistence/transaction.schema';

const MODEL_NAME = 'Transaction';
const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MODEL_NAME, schema: TransactionSchema },
    ]),
    // Provides GetLatestExchangeRateUseCase, which this module uses to read the rate.
    ExchangeRateModule,
  ],
  controllers: [TransactionsController],
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      inject: [getModelToken(MODEL_NAME)],
      useFactory: (model: Model<TransactionDocument>) =>
        new MongoTransactionRepository(model),
    },
    {
      provide: CreateTransactionUseCase,
      inject: [GetLatestExchangeRateUseCase, TRANSACTION_REPOSITORY],
      useFactory: (
        latestRate: GetLatestExchangeRateUseCase,
        transactions: TransactionRepository,
      ) => new CreateTransactionUseCase(latestRate, transactions),
    },
    {
      provide: GetHistoryUseCase,
      inject: [TRANSACTION_REPOSITORY],
      useFactory: (transactions: TransactionRepository) =>
        new GetHistoryUseCase(transactions),
    },
  ],
})
export class TransactionsModule {}
