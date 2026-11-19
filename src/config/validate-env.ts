const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN'];
const MIN_SECRET_LENGTH = 16;

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
}
