export class InvalidEmailError extends Error {
  constructor(raw: string) {
    super(`Invalid email: ${raw}`);
    this.name = 'InvalidEmailError';
  }
}
export class InvalidNameError extends Error {
  constructor() {
    super('Name is required');
    this.name = 'InvalidNameError';
  }
}
