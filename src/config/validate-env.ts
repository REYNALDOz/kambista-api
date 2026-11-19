const REQUIRED = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'EXCHANGE_RATE_API_URL',
];
const POSITIVE_INTEGERS = [
  'EXCHANGE_RATE_TIMEOUT_MS',
  'EXCHANGE_RATE_REFRESH_MS',
  'LOGIN_MAX_FAILURES',
  'LOGIN_WINDOW_MS',
];
const MIN_SECRET_LENGTH = 16;

/** Fails at startup with a clear message, instead of failing later in the middle of a request. */
export function validateEnv(env: Record<string, unknown>): void {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  if (String(env.JWT_SECRET).length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  if (!isHttpUrl(String(env.EXCHANGE_RATE_API_URL))) {
    throw new Error('EXCHANGE_RATE_API_URL must be a valid http(s) URL');
  }
  for (const name of POSITIVE_INTEGERS) {
    // Optional: when it is not set, the code uses its own default.
    const value = env[name];
    if (
      value !== undefined &&
      !(typeof value === 'string' && /^[1-9]\d*$/.test(value))
    ) {
      throw new Error(`${name} must be a positive integer`);
    }
  }
  // 0 is valid here: it turns the exchange rate cache off.
  const ttl = env.EXCHANGE_RATE_CACHE_TTL_MS;
  if (
    ttl !== undefined &&
    !(typeof ttl === 'string' && /^(0|[1-9]\d*)$/.test(ttl))
  ) {
    throw new Error(
      'EXCHANGE_RATE_CACHE_TTL_MS must be an integer, 0 or greater',
    );
  }
}

function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
