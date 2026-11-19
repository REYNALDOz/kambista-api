import { PasswordHasher } from '../../domain/ports/password-hasher';
import { TokenIssuer, TokenPayload } from '../../domain/ports/token-issuer';
import { UserRepository } from '../../domain/ports/user.repository';
import { User } from '../../domain/user';
import { Email } from '../../domain/value-objects/email';

/** Keeps users in an array and assigns ids like a real database would. */
export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  findByEmail(email: Email): Promise<User | null> {
    const found = this.users.find((user) => user.email.value === email.value);
    return Promise.resolve(found ?? null);
  }

  save(user: User): Promise<User> {
    const saved = User.restore({
      id: `id-${this.users.length + 1}`,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
    });
    this.users.push(saved);
    return Promise.resolve(saved);
  }
}

/** A readable, reversible fake: the "hash" of `secret` is `hashed:secret`. */
export class FakePasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(`hashed:${plain}` === hash);
  }
}

/** Returns a predictable token and remembers what it was asked to sign. */
export class FakeTokenIssuer implements TokenIssuer {
  readonly issued: TokenPayload[] = [];

  issue(payload: TokenPayload): Promise<string> {
    this.issued.push(payload);
    return Promise.resolve(`token-for-${payload.sub}`);
  }
}
