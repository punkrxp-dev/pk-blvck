/**
 * Circuit Breaker Pattern for AI API Calls
 *
 * Prevents cascade failures when AI services are unavailable or rate-limited.
 * Implements exponential backoff and automatic recovery.
 */

import { log } from '../utils/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;     // Failures before opening circuit
  recoveryTimeout: number;      // Time before trying to recover (ms)
  monitoringPeriod: number;     // Time window for failure counting (ms)
  successThreshold: number;     // Successes needed in HALF_OPEN to close
  maxRetries: number;           // Maximum retry attempts for rate limits
  baseBackoffMs: number;        // Base backoff time for retries
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
  rateLimitHits: number;
  retriesAttempted: number;
  retriesSuccessful: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private totalRequests = 0;
  private totalFailures = 0;
  private rateLimitHits = 0;
  private retriesAttempted = 0;
  private retriesSuccessful = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {
    log(`Circuit Breaker initialized: ${name}`, 'circuit-breaker', 'info');
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    if (!error) return false;

    // OpenAI rate limit errors
    if (error?.status === 429) return true;
    if (error?.code === 'rate_limit_exceeded') return true;
    if (error?.type === 'rate_limit_error') return true;

    // Google AI rate limit errors
    if (error?.statusCode === 429) return true;
    if (error?.message?.includes('rate limit')) return true;
    if (error?.message?.includes('quota exceeded')) return true;

    // Generic rate limit detection
    const message = error.message || error.toString();
    if (message.includes('rate limit') || message.includes('quota')) return true;

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = this.config.baseBackoffMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with retry logic for rate limits
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await fn();

        // Track successful retries
        if (attempt > 0) {
          this.retriesSuccessful++;
          log(`Retry successful on attempt ${attempt + 1}`, this.name, 'info');
        }

        return result;
      } catch (error) {
        lastError = error;

        if (this.isRateLimitError(error)) {
          this.rateLimitHits++;
          this.retriesAttempted++;

          if (attempt < this.config.maxRetries) {
            const delay = this.calculateBackoffDelay(attempt);
            log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries + 1})`, this.name, 'warn');
            await this.sleep(delay);
            continue;
          }
        }

        // Not a rate limit error or max retries reached
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
        log(`Circuit breaker ${this.name}: OPEN → HALF_OPEN (testing recovery)`, 'circuit-breaker', 'info');
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - service unavailable`);
      }
    }

    try {
      const result = await this.executeWithRetry(fn);
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.successes++;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        log(`Circuit breaker ${this.name}: HALF_OPEN → CLOSED (service recovered)`, 'circuit-breaker', 'info');
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in monitoring period
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.config.monitoringPeriod) {
        this.failures = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED && this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      log(`Circuit breaker ${this.name}: CLOSED → OPEN (${this.failures} failures)`, 'circuit-breaker', 'warn');
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery test, go back to OPEN
      this.state = CircuitState.OPEN;
      log(`Circuit breaker ${this.name}: HALF_OPEN → OPEN (recovery test failed)`, 'circuit-breaker', 'warn');
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      rateLimitHits: this.rateLimitHits,
      retriesAttempted: this.retriesAttempted,
      retriesSuccessful: this.retriesSuccessful,
    };
  }

  /**
   * Manually reset the circuit breaker (for testing/admin)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    log(`Circuit breaker ${this.name} manually reset`, 'circuit-breaker', 'info');
  }

  /**
   * Force circuit to open (for testing/admin)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    log(`Circuit breaker ${this.name} forced OPEN`, 'circuit-breaker', 'warn');
  }
}

// Global circuit breakers for AI services
export const openaiCircuitBreaker = new CircuitBreaker('OpenAI', {
  failureThreshold: 5,      // Open after 5 failures
  recoveryTimeout: 60000,   // Wait 1 minute before testing
  monitoringPeriod: 300000, // 5 minutes monitoring window
  successThreshold: 3,      // Need 3 successes to close
  maxRetries: 3,            // Retry up to 3 times on rate limits
  baseBackoffMs: 1000,      // Start with 1 second backoff
});

export const googleCircuitBreaker = new CircuitBreaker('GoogleAI', {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  monitoringPeriod: 300000,
  successThreshold: 3,
  maxRetries: 3,            // Retry up to 3 times on rate limits
  baseBackoffMs: 1000,      // Start with 1 second backoff
});

/**
 * Get circuit breaker statistics for monitoring
 */
export function getCircuitBreakerStats() {
  return {
    openai: openaiCircuitBreaker.getStats(),
    google: googleCircuitBreaker.getStats(),
  };
}

/**
 * Reset all circuit breakers (admin function)
 */
export function resetAllCircuitBreakers() {
  openaiCircuitBreaker.reset();
  googleCircuitBreaker.reset();
  log('All circuit breakers reset', 'circuit-breaker', 'info');
}