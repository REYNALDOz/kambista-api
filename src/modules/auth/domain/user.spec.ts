import { User } from './user';
import { Email } from './value-objects/email';

describe('User', () => {
  const email = Email.create('reynaldo@example.com');

  it('registers a new user with the default role "user"', () => {
    const user = User.register({
      name: 'Reynaldo Pérez',
      email,
      passwordHash: 'hashed',
    });

    expect(user.name).toBe('Reynaldo Pérez');
    expect(user.email.value).toBe('reynaldo@example.com');
    expect(user.passwordHash).toBe('hashed');
    expect(user.role).toBe('user');
  });

  it('trims the name', () => {
    const user = User.register({
      name: '  Reynaldo  ',
      email,
      passwordHash: 'hashed',
    });
    expect(user.name).toBe('Reynaldo');
  });

  it('rejects an empty name', () => {
    expect(() =>
      User.register({ name: '   ', email, passwordHash: 'hashed' }),
    ).toThrow('Name is required');
  });

  it('rebuilds an existing user with its id and role', () => {
    const user = User.restore({
      id: 'abc123',
      name: 'Ana',
      email,
      passwordHash: 'hashed',
      role: 'admin',
    });

    expect(user.id).toBe('abc123');
    expect(user.role).toBe('admin');
  });
});
