import { RefreshExchangeRateUseCase } from './refresh-exchange-rate.use-case';
import {
  aRate,
  FakeExchangeRateProvider,
  InMemoryExchangeRateRepository,
} from './testing/fakes';

describe('RefreshExchangeRateUseCase', () => {
  it('saves the rate that the provider returns', async () => {
    const repository = new InMemoryExchangeRateRepository();
    const rate = aRate();
    const useCase = new RefreshExchangeRateUseCase(
      new FakeExchangeRateProvider(rate),
      repository,
    );

    const result = await useCase.execute();

    expect(result).toBe(rate);
    expect(repository.rates).toEqual([rate]);
  });

  it('saves nothing when the provider fails', async () => {
    const repository = new InMemoryExchangeRateRepository();
    const useCase = new RefreshExchangeRateUseCase(
      new FakeExchangeRateProvider(new Error('provider is down')),
      repository,
    );

    await expect(useCase.execute()).rejects.toThrow('provider is down');
    expect(repository.rates).toHaveLength(0);
  });
});
