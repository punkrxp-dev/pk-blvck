import { CircuitBreaker, CircuitState } from '../../server/ai/circuit-breaker';

describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockFn: jest.Mock;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('TestCircuit', {
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringPeriod: 5000,
      successThreshold: 2,
      maxRetries: 2,
      baseBackoffMs: 100,
    });
    mockFn = jest.fn();
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });

  describe('Successful Operations', () => {
    it('should remain CLOSED on successful operations', async () => {
      mockFn.mockResolvedValue('success');

      await circuitBreaker.execute(mockFn);
      const stats = circuitBreaker.getStats();

      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(0);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Failure Handling', () => {
    it('should count failures but remain CLOSED below threshold', async () => {
      mockFn.mockRejectedValue(new Error('Test error'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(2);
      expect(stats.successes).toBe(0);
    });

    it('should open circuit after reaching failure threshold', async () => {
      mockFn.mockRejectedValue(new Error('Test error'));

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
      expect(stats.failures).toBe(3);
    });

    it('should reject calls when OPEN', async () => {
      mockFn.mockRejectedValue(new Error('Test error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }

      // This call should fail fast
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker TestCircuit is OPEN');
      expect(mockFn).toHaveBeenCalledTimes(3); // Only the initial 3 calls
    });
  });

  describe('Recovery', () => {
    beforeEach(async () => {
      mockFn.mockRejectedValue(new Error('Test error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }

      expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.HALF_OPEN);
      expect(stats.successes).toBe(1);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      mockFn.mockResolvedValue('success');

      // Need 2 successes to close
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getStats().state).toBe(CircuitState.HALF_OPEN);

      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getStats().state).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      mockFn.mockRejectedValue(new Error('Still failing'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      expect(circuitBreaker.getStats().state).toBe(CircuitState.OPEN);
    });
  });

  describe('Rate Limit Handling', () => {
    it('should detect rate limit errors', () => {
      const rateLimitError = { status: 429 };
      expect((circuitBreaker as any).isRateLimitError(rateLimitError)).toBe(true);

      const quotaError = { message: 'quota exceeded' };
      expect((circuitBreaker as any).isRateLimitError(quotaError)).toBe(true);

      const normalError = new Error('Normal error');
      expect((circuitBreaker as any).isRateLimitError(normalError)).toBe(false);
    });

    it('should retry on rate limit errors', async () => {
      let callCount = 0;
      mockFn.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw { status: 429, message: 'Rate limit exceeded' };
        }
        return 'success';
      });

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(callCount).toBe(3); // 2 failures + 1 success
      expect(circuitBreaker.getStats().rateLimitHits).toBe(2);
      expect(circuitBreaker.getStats().retriesAttempted).toBe(2);
      expect(circuitBreaker.getStats().retriesSuccessful).toBe(1);
    });

    it('should respect max retries', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockFn.mockRejectedValue(rateLimitError);

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(circuitBreaker.getStats().retriesAttempted).toBe(3);
      expect(circuitBreaker.getStats().retriesSuccessful).toBe(0);
    });

    it('should implement exponential backoff', async () => {
      const startTime = Date.now();
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockFn.mockRejectedValue(rateLimitError);

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least baseBackoffMs * (1 + 2) = 300ms
      expect(duration).toBeGreaterThan(250);
    });
  });

  describe('Statistics', () => {
    it('should track comprehensive statistics', async () => {
      // Mix of successes and failures
      mockFn.mockResolvedValueOnce('success1');
      await circuitBreaker.execute(mockFn);

      mockFn.mockRejectedValueOnce(new Error('error1'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      mockFn
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce(Object.assign(new Error('Rate limit'), { status: 429 }))
        .mockRejectedValueOnce(Object.assign(new Error('Rate limit'), { status: 429 }));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();

      const stats = circuitBreaker.getStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(2);
      expect(stats.rateLimitHits).toBe(3);
      expect(stats.retriesAttempted).toBe(3); // 3 retries attempted (all failed)
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all statistics', async () => {
      mockFn.mockRejectedValue(new Error('error'));

      // Cause some failures
      for (let i = 0; i < 2; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }

      expect(circuitBreaker.getStats().failures).toBe(2);

      // Reset
      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.rateLimitHits).toBe(0);
      expect(stats.retriesAttempted).toBe(0);
      expect(stats.retriesSuccessful).toBe(0);
    });
  });
});