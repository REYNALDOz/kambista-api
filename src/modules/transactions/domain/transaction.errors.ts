export class SameCurrencyError extends Error {
  constructor() {
    super('The source and target currencies must be different');
    this.name = 'SameCurrencyError';
  }
}

export class InvalidAmountError extends Error {
  constructor() {
    super('The amount must be a number greater than zero');
    this.name = 'InvalidAmountError';
  }
}

export class InvalidDateRangeError extends Error {
  constructor() {
    super(
      'startDate and endDate must be valid dates, and startDate cannot be after endDate',
    );
    this.name = 'InvalidDateRangeError';
  }
}
