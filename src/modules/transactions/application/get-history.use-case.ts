import { Role } from '../../auth/domain/value-objects/role';
import { Page, TransactionRepository } from '../domain/ports/transaction.repository';
import { Transaction } from '../domain/transaction';
import { InvalidDateRangeError } from '../domain/transaction.errors';

export const DEFAULT_LIMIT = 10;

export interface GetHistoryInput {
  page?: number;
  limit?: number;
}
export interface GetHistoryInput {
  requesterId: string;
  requesterRole: Role;
  startDate: string;
  endDate: string;
  userId?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class GetHistoryUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(input: GetHistoryInput): Promise<Page<Transaction>> {
    const from = new Date(input.startDate);
    const to = this.endOfRange(input.endDate);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from > to
    ) {
      throw new InvalidDateRangeError();
    }

    return this.transactions.findByUser(this.whoseHistory(input), from, to, {
      page: input.page ?? 1,
      limit: input.limit ?? DEFAULT_LIMIT,
    });
  }

  /** A regular user always sees their own history, whatever userId they send. */
  private whoseHistory({
    requesterId,
    requesterRole,
    userId,
  }: GetHistoryInput): string {
    return requesterRole === 'admin' ? (userId ?? requesterId) : requesterId;
  }

  /** "2024-01-18" as an end date includes that whole day. */
  private endOfRange(endDate: string): Date {
    return new Date(
      DATE_ONLY.test(endDate) ? `${endDate}T23:59:59.999Z` : endDate,
    );
  }
}
