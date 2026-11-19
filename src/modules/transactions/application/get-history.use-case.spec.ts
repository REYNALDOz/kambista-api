import { Transaction } from '../domain/transaction';
import { InvalidDateRangeError } from '../domain/transaction.errors';
import { GetHistoryUseCase } from './get-history.use-case';
import { aRate, InMemoryTransactionRepository } from './testing/fakes';

describe('GetHistoryUseCase', () => {
  let repository: InMemoryTransactionRepository;
  let useCase: GetHistoryUseCase;

  const exchange = (userId: string, at: string) =>
    repository.save(
      Transaction.create({
        userId,
        from: 'USD',
        to: 'PEN',
        amount: 10,
        rate: aRate(),
        now: new Date(at),
      }),
    );

  beforeEach(async () => {
    repository = new InMemoryTransactionRepository();
    useCase = new GetHistoryUseCase(repository);
    await exchange('user-1', '2024-01-10T10:00:00Z');
    await exchange('user-1', '2024-01-18T22:00:00Z');
    await exchange('user-2', '2024-01-12T10:00:00Z');
  });

  const range = { startDate: '2024-01-01', endDate: '2024-01-31' };

  it('returns only the transactions of the user, newest first', async () => {
    const result = await useCase.execute({
      requesterId: 'user-1',
      requesterRole: 'user',
      ...range,
    });

    expect(result.items.map((t) => t.id)).toEqual(['tx-2', 'tx-1']);
  });

  it('ignores the userId sent by a regular user: they always see their own', async () => {
    const result = await useCase.execute({
      requesterId: 'user-1',
      requesterRole: 'user',
      userId: 'user-2',
      ...range,
    });

    expect(result.items.every((t) => t.userId === 'user-1')).toBe(true);
  });

  it('lets an admin see the history of another user', async () => {
    const result = await useCase.execute({
      requesterId: 'admin-1',
      requesterRole: 'admin',
      userId: 'user-2',
      ...range,
    });

    expect(result.items.map((t) => t.userId)).toEqual(['user-2']);
  });

  it('shows the admin their own history when no userId is sent', async () => {
    const result = await useCase.execute({
      requesterId: 'user-1',
      requesterRole: 'admin',
      ...range,
    });

    expect(result.items).toHaveLength(2);
  });

  it('includes the whole last day of the range', async () => {
    const result = await useCase.execute({
      requesterId: 'user-1',
      requesterRole: 'user',
      startDate: '2024-01-18',
      endDate: '2024-01-18',
    });

    expect(result.items.map((t) => t.id)).toEqual(['tx-2']);
  });

  it.each([
    ['startDate is after endDate', '2024-02-01', '2024-01-01'],
    ['a date does not exist', '2024-02-31', '2024-03-01'],
  ])('rejects the range when %s', async (_reason, startDate, endDate) => {
    await expect(
      useCase.execute({
        requesterId: 'user-1',
        requesterRole: 'user',
        startDate,
        endDate,
      }),
    ).rejects.toThrow(InvalidDateRangeError);
  });
});
