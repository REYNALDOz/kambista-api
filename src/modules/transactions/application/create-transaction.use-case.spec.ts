import { ExchangeRateNotAvailableError } from '../../exchange-rate/domain/exchange-rate.errors';
import { SameCurrencyError } from '../domain/transaction.errors';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { aRate, InMemoryTransactionRepository } from './testing/fakes';

describe('CreateTransactionUseCase', () => {
  let repository: InMemoryTransactionRepository;

  beforeEach(() => {
    repository = new InMemoryTransactionRepository();
  });

  const input = { userId: 'u1', from: 'USD', to: 'PEN', amount: 100 } as const;

  it('converts with the latest rate and saves the transaction for the user', async () => {
    const useCase = new CreateTransactionUseCase(
      { execute: () => Promise.resolve(aRate()) },
      repository,
    );

    const tx = await useCase.execute(input);

    expect(tx.id).toBe('tx-1');
    expect(tx.userId).toBe('u1');
    expect(tx.convertedAmount.toNumber()).toBe(373.9);
    expect(repository.transactions).toHaveLength(1);
  });

  it('fails and saves nothing when there is no exchange rate yet', async () => {
    const useCase = new CreateTransactionUseCase(
      { execute: () => Promise.reject(new ExchangeRateNotAvailableError()) },
      repository,
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      ExchangeRateNotAvailableError,
    );
    expect(repository.transactions).toHaveLength(0);
  });

  it('saves nothing when the request is invalid', async () => {
    const useCase = new CreateTransactionUseCase(
      { execute: () => Promise.resolve(aRate()) },
      repository,
    );

    await expect(useCase.execute({ ...input, to: 'USD' })).rejects.toThrow(
      SameCurrencyError,
    );
    expect(repository.transactions).toHaveLength(0);
  });
});
