import { InvalidCredentialsError } from '../domain/auth.errors';
import { LoginUseCase } from './login.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import {
  FakePasswordHasher,
  FakeTokenIssuer,
  InMemoryUserRepository,
  NeverBlockingLimiter,
} from './testing/fakes';

describe('LoginUseCase', () => {
  let tokens: FakeTokenIssuer;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    tokens = new FakeTokenIssuer();
    useCase = new LoginUseCase(
      users,
      hasher,
      tokens,
      new NeverBlockingLimiter(),
    );

    await new RegisterUserUseCase(users, hasher).execute({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'secret123',
    });
  });

  it('returns a token and the public user data for valid credentials', async () => {
    const result = await useCase.execute({
      email: 'juan@example.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('token-for-id-1');
    expect(result.user).toEqual({
      id: 'id-1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: 'user',
    });
    expect(tokens.issued).toEqual([{ sub: 'id-1', role: 'user' }]);
  });

  it('accepts the email regardless of case and surrounding spaces', async () => {
    const result = await useCase.execute({
      email: '  JUAN@example.com ',
      password: 'secret123',
    });

    expect(result.user.email).toBe('juan@example.com');
  });

  it('rejects a wrong password', async () => {
    await expect(
      useCase.execute({
        email: 'juan@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects an unknown email with the same error as a wrong password', async () => {
    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'secret123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a malformed email as invalid credentials, not as a server error', async () => {
    await expect(
      useCase.execute({ email: 'not-an-email', password: 'secret123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('does not issue a token when the login fails', async () => {
    await useCase
      .execute({ email: 'juan@example.com', password: 'wrong' })
      .catch(() => undefined);

    expect(tokens.issued).toHaveLength(0);
  });
});
