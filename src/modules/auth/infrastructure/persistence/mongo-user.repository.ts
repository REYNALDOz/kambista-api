import { Model } from 'mongoose';

import { UserDocument } from './user.schema';
import { UserRepository } from '../../domain/ports/user.repository';
import { Email } from '../../domain/value-objects/email';
import { User } from '../../domain/user';
import { EmailAlreadyRegisteredError } from '../../domain/auth.errors';

type StoredUser = UserDocument & { _id: { toString(): string } };

export class MongoUserRepository implements UserRepository {
  constructor(private readonly model: Model<UserDocument>) {}

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await this.model
      .findOne({ email: email.value })
      .lean<StoredUser>();
    return doc ? this.toDomain(doc) : null;
  }

  async save(user: User): Promise<User> {
    try {
      const created = await this.model.create({
        name: user.name,
        email: user.email.value,
        passwordHash: user.passwordHash,
        role: user.role,
      });
      return this.toDomain(created.toObject() as StoredUser);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }

  private toDomain(doc: StoredUser): User {
    return User.restore({
      id: doc._id.toString(),
      name: doc.name,
      email: Email.create(doc.email),
      passwordHash: doc.passwordHash,
      role: doc.role,
    });
  }
}

const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === DUPLICATE_KEY_CODE
  );
}
