import { EmailAlreadyRegisteredError } from '../domain/auth.errors';
import { RegisterUserUseCase } from './register-user.use-case';
import { FakePasswordHasher, InMemoryUserRepository } from './testing/fakes';

describe('RegisterUserUseCase', () => {
  let users: InMemoryUserRepository;
  let useCase: RegisterUserUseCase;

  const input = {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    password: 'secret123',
  };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    useCase = new RegisterUserUseCase(users, new FakePasswordHasher());
  });

  it('registers the user with the default role and without exposing the password', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual({
      id: 'id-1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      role: 'user',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('stores the hash, never the plain password', async () => {
    await useCase.execute(input);

    expect(users.users[0].passwordHash).toBe('hashed:secret123');
  });

  it('rejects an email that is already registered', async () => {
    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
  });

  it('treats the email case-insensitively when checking duplicates', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, email: 'JUAN@Example.com' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
