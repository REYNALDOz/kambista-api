import { ExchangeRateNotAvailableError } from '../domain/exchange-rate.errors';
import { GetLatestExchangeRateUseCase } from './get-latest-exchange-rate.use-case';
import { aRate, InMemoryExchangeRateRepository } from './testing/fakes';

describe('GetLatestExchangeRateUseCase', () => {
  let repository: InMemoryExchangeRateRepository;
  let useCase: GetLatestExchangeRateUseCase;

  beforeEach(() => {
    repository = new InMemoryExchangeRateRepository();
    useCase = new GetLatestExchangeRateUseCase(repository);
  });

  it('fails when no exchange rate has been registered yet', async () => {
    await expect(useCase.execute()).rejects.toThrow(
      ExchangeRateNotAvailableError,
    );
  });

  it('returns the most recently saved rate', async () => {
    await repository.save(aRate(3.7));
    await repository.save(aRate(3.8));

    const latest = await useCase.execute();

    expect(latest.sell.toNumber()).toBe(3.8);
  });
});
