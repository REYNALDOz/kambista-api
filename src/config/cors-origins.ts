export const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

/**
 * The browser sends the Origin header as `scheme://host[:port]`, with no path and no trailing
 * slash, and the CORS check compares text. So `http://localhost:5173/` in the configuration
 * would block every request. Each value is reduced to the form the browser sends.
 */
export function parseCorsOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '')
    .map(toOrigin);
  const unique = [...new Set(origins)];
  return unique.length > 0 ? unique : [DEFAULT_CORS_ORIGIN];
}

function toOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    // Not a URL: startup validation reports it, so here it is kept as it was written.
    return value;
  }
}
