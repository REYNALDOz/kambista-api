export interface LoginAttemptLimiter {
  isBlocked(key: string): Promise<boolean>;
  recordFailure(key: string): Promise<void>;
  reset(key: string): Promise<void>;
}
