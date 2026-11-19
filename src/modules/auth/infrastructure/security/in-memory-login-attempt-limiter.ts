import { LoginAttemptLimiter } from '../../domain/ports/login-attempt-limiter';

interface Attempts {
  failures: number;
  windowStart: number;
}

/** When the map has this many keys, the expired ones are removed so it cannot grow forever. */
const PURGE_THRESHOLD = 10_000;

/**
 * Counts failed logins in memory: after `maxFailures` failures inside a window of `windowMs`,
 * the key is blocked until that window ends.
 *
 * It works for one instance of the API. With several instances each one counts on its own,
 * so a shared store (such as Redis) would be needed behind the same port.
 */
export class InMemoryLoginAttemptLimiter implements LoginAttemptLimiter {
  private readonly attempts = new Map<string, Attempts>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  isBlocked(key: string): Promise<boolean> {
    const current = this.current(key);
    return Promise.resolve(
      current !== undefined && current.failures >= this.maxFailures,
    );
  }

  recordFailure(key: string): Promise<void> {
    const current = this.current(key);
    if (current) {
      current.failures += 1;
    } else {
      this.purgeIfTooBig();
      this.attempts.set(key, { failures: 1, windowStart: this.now() });
    }
    return Promise.resolve();
  }

  reset(key: string): Promise<void> {
    this.attempts.delete(key);
    return Promise.resolve();
  }

  /** The attempts of a key, or undefined when there are none or their window has ended. */
  private current(key: string): Attempts | undefined {
    const found = this.attempts.get(key);
    if (found && this.now() - found.windowStart >= this.windowMs) {
      this.attempts.delete(key);
      return undefined;
    }
    return found;
  }

  private purgeIfTooBig(): void {
    if (this.attempts.size < PURGE_THRESHOLD) return;
    for (const key of this.attempts.keys()) this.current(key);
  }
}
