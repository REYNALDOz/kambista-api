import { Transaction } from '../transaction';

export interface PageRequest {
  page: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}
export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findByUser(
    userId: string,
    from: Date,
    to: Date,
    paging: PageRequest,
  ): Promise<Page<Transaction>>;
}
