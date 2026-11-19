type Env = Record<string, unknown>;
type Check = (value: string) => string | null;

const MIN_SECRET_LENGTH = 16;
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const DURATION = /^[1-9]\d*(ms|s|m|h|d|w)$/;

const mongoUri: Check = (value) =>
  /^mongodb(\+srv)?:\/\//.test(value)
    ? null
    : 'must start with mongodb:// or mongodb+srv://';

const secret: Check = (value) =>
  value.length >= MIN_SECRET_LENGTH
    ? null
    : `must be at least ${MIN_SECRET_LENGTH} characters`;

const duration: Check = (value) =>
  DURATION.test(value) ? null : 'must be a duration such as 15m, 1h or 7d';

const positiveInteger: Check = (value) =>
  POSITIVE_INTEGER.test(value) ? null : 'must be a positive integer';

const httpUrl: Check = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:'
      ? null
      : 'must be an http(s) URL';
  } catch {
    return 'must be a valid http(s) URL';
  }
};

const corsOrigins: Check = (value) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .every((origin) => httpUrl(origin) === null)
    ? null
    : 'must be a comma-separated list of http(s) origins';

/**
 * Fails at startup, listing every problem at once, instead of failing later
 * in the middle of a request. Each feature adds its own variables here.
 */
export function validateEnv(env: Env): Env {
  const problems: string[] = [];

  const read = (name: string): string | undefined => {
    const value = env[name];
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  const check = (name: string, validate: Check, isRequired: boolean): void => {
    const value = read(name);
    if (value === undefined) {
      if (isRequired) problems.push(`${name}: is required`);
      return;
    }
    const problem = validate(value);
    if (problem) problems.push(`${name}: ${problem}`);
  };

  check('MONGODB_URI', mongoUri, true);
  check('JWT_SECRET', secret, true);
  check('JWT_EXPIRES_IN', duration, true);
  check('PORT', positiveInteger, false);
  check('CORS_ORIGIN', corsOrigins, false);

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n - ${problems.join('\n - ')}`,
    );
  }
  return env;
}
