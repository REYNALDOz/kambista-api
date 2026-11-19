export class InvalidEmailError extends Error {
  constructor() {
    super('Invalid format email');
    this.name = 'InvalidEmailError';
  }
}
export class InvalidNameError extends Error {
  constructor() {
    super('Name is required');
    this.name = 'InvalidNameError';
  }
}
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}
export class TooManyLoginAttemptsError extends Error {
  constructor() {
    super('Too many failed login attempts. Try again later.');
    this.name = 'TooManyLoginAttemptsError';
  }
}
export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email is already registered');
    this.name = 'EmailAlreadyRegisteredError';
  }
}
