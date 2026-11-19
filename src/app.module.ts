import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        // Logs the connection state changes (the URI is never logged: it has the password).
        connectionFactory: (connection: Connection) => {
          const logger = new Logger('MongoDB');
          connection.on('connected', () =>
            logger.log(`Connected to database "${connection.name}"`),
          );
          connection.on('disconnected', () => logger.warn('Disconnected'));
          connection.on('error', (error: Error) =>
            logger.error(`Connection error: ${error.message}`),
          );
          return connection;
        },
      }),
    }),
    AuthModule,
    ExchangeRateModule,
    TransactionsModule,
  ],
})
export class AppModule {}
