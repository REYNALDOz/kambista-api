import { Role } from '../../auth/domain/value-objects/role';
import { TransactionRepository } from '../domain/ports/transaction.repository';
import { Transaction } from '../domain/transaction';
import { InvalidDateRangeError } from '../domain/transaction.errors';

export interface GetHistoryInput {
  requesterId: string;
  requesterRole: Role;
  startDate: string;
  endDate: string;
  /** Only honored for admins. */
  userId?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class GetHistoryUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(input: GetHistoryInput): Promise<Transaction[]> {
    const from = new Date(input.startDate);
    const to = this.endOfRange(input.endDate);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from > to
    ) {
      throw new InvalidDateRangeError();
    }

    return this.transactions.findByUser(this.whoseHistory(input), from, to);
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
