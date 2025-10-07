/**
 * Retry utility with exponential backoff
 * Inspired by Stripe's retry mechanism
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  factor: number; // exponential factor (default: 2)
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  factor: 2,
};

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  options: RetryOptions
): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.factor, attempt);
  const delayWithMax = Math.min(exponentialDelay, options.maxDelay);

  // Add jitter (random value between 0 and delay)
  // This prevents thundering herd problem
  const jitter = Math.random() * delayWithMax * 0.1; // 10% jitter

  return delayWithMax + jitter;
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('https://api.example.com');
 *     if (!response.ok) throw new Error('Request failed');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     maxDelay: 10000,
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultOptions, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        break;
      }

      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, lastError);
      }

      // Calculate delay and wait before next attempt
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is retryable
 * Network errors, timeouts, and 5xx errors are retryable
 * 4xx errors (except 429 Too Many Requests) are not retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;

    // 5xx errors are retryable
    if (status >= 500) {
      return true;
    }

    // 429 Too Many Requests is retryable
    if (status === 429) {
      return true;
    }

    // 408 Request Timeout is retryable
    if (status === 408) {
      return true;
    }

    // Everything else is not retryable
    return false;
  }

  // Unknown errors are retryable
  return true;
}

/**
 * Retry with smart error detection
 * Only retries if the error is retryable
 */
export async function smartRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultOptions, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        break;
      }

      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, lastError);
      }

      // Calculate delay and wait before next attempt
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Retry a specific function until a condition is met
 * Useful for polling operations
 */
export async function retryUntil<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: Partial<RetryOptions> & { timeout?: number } = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultOptions, ...options };
  const timeout = options.timeout || 60000; // 1 minute default
  const startTime = Date.now();

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();

      if (condition(result)) {
        return result;
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('Retry timeout exceeded');
      }

      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, new Error('Condition not met'));
      }

      // Calculate delay and wait before next attempt
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    } catch (error) {
      // If error thrown, check if it's the last attempt
      if (attempt === opts.maxRetries) {
        throw error;
      }

      if (opts.onRetry) {
        const err = error instanceof Error ? error : new Error(String(error));
        opts.onRetry(attempt + 1, err);
      }

      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw new Error('Retry condition not met after max attempts');
}
