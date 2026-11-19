// Runs before the e2e tests: safe defaults for the variables the app validates.
// (A real .env, if present, is loaded by the app itself and takes priority.)
process.env.JWT_SECRET ??= 'e2e-secret-with-enough-length';
process.env.JWT_EXPIRES_IN ??= '15m';
process.env.EXCHANGE_RATE_API_URL ??=
  'https://api.apis.net.pe/v1/tipo-cambio-sunat';
// The tests save their own exchange rate; the scheduler must not call SUNAT.
process.env.EXCHANGE_RATE_SYNC_ENABLED = 'false';
