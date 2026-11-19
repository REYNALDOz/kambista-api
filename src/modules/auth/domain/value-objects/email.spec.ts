import { Email } from './email';

describe('Email', () => {
  it('creates a valid email', () => {
    expect(Email.create('reynaldo@example.com').value).toBe(
      'reynaldo@example.com',
    );
  });

  it('normalizes to lowercase and trims spaces', () => {
    expect(Email.create('  Reynaldo@Example.COM ').value).toBe(
      'reynaldo@example.com',
    );
  });

  // Casos de prueba para emails inválidos, se espera que lance un error InvalidEmailError
  it.each(['', 'reynaldo', 'reynaldo@', '@example.com', 'reynaldo@example'])(
    'rejects invalid email "%s"',
    (raw) => {
      expect(() => Email.create(raw)).toThrow('Invalid email');
    },
  );
});
