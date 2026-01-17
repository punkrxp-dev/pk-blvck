import { SentinelAgent } from '../../server/ai/agents/sentinel.agent';
import { ObserverAgent } from '../../server/ai/agents/observer.agent';
import { IntentAgent } from '../../server/ai/agents/intent.agent';

describe('AI Agents', () => {
  describe('SentinelAgent', () => {
    let agent: SentinelAgent;

    beforeEach(() => {
      agent = new SentinelAgent();
    });

    describe('Validation', () => {
      it('should validate clean input', () => {
        const input = {
          email: 'user@company.com',
          message: 'Hello, I am interested in your services.',
          source: 'web',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(true);
      });

      it('should reject disposable emails', () => {
        const input = {
          email: 'test@10minutemail.com',
          message: 'Hello',
          source: 'web',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });

      it('should reject invalid sources', () => {
        const input = {
          email: 'user@company.com',
          message: 'Hello',
          source: 'invalid',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });

      it('should reject suspicious content', () => {
        const input = {
          email: 'user@company.com',
          message: '<script>alert("xss")</script>',
          source: 'web',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });
    });

    describe('Fallback Processing', () => {
      it('should handle spam detection in fallback', async () => {
        const input = {
          email: 'user@company.com',
          message: 'Win casino prizes now!',
          source: 'web',
        };

        const result = await (agent as any).processWithFallback(input);

        expect(result.spam).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('should pass clean messages in fallback', async () => {
        const input = {
          email: 'user@company.com',
          message: 'Hello, I am interested in your fitness program.',
          source: 'web',
        };

        const result = await (agent as any).processWithFallback(input);

        expect(result.spam).toBe(false);
        expect(result.sanitized).toBe(true);
        expect(result.confidence).toBe(0.5);
      });
    });
  });

  describe('ObserverAgent', () => {
    let agent: ObserverAgent;

    beforeEach(() => {
      agent = new ObserverAgent();
    });

    describe('Validation', () => {
      it('should validate clean email', () => {
        const input = { email: 'user@company.com' };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(true);
      });

      it('should reject disposable emails', () => {
        const input = { email: 'test@10minutemail.com' };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });

      it('should reject invalid email formats', () => {
        const input = { email: 'invalid-email' };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('IntentAgent', () => {
    let agent: IntentAgent;

    beforeEach(() => {
      agent = new IntentAgent();
    });

    describe('Validation', () => {
      it('should validate clean input', () => {
        const input = {
          email: 'user@company.com',
          message: 'Hello, I am interested in your premium fitness program.',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Tech Corp',
          position: 'Manager',
          verified: true,
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(true);
      });

      it('should reject suspicious emails', () => {
        const input = {
          email: 'test@temp-mail.org',
          message: 'Hello',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });

      it('should reject malicious content', () => {
        const input = {
          email: 'user@company.com',
          message: 'SELECT * FROM users; <script>alert("xss")</script>',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });

      it('should reject invalid names', () => {
        const input = {
          email: 'user@company.com',
          message: 'Hello',
          firstName: 'John123!@#',
        };

        const isValid = (agent as any).validate(input);
        expect(isValid).toBe(false);
      });
    });

    describe('Fallback Processing', () => {
      it('should classify low intent in fallback', async () => {
        const input = {
          email: 'user@company.com',
          message: 'Just browsing your website.',
        };

        const result = await (agent as any).processWithFallback(input);

        expect(result.intent).toBe('low');
        expect(result.confidence).toBeLessThan(0.5);
        expect(result.reasoning).toContain('fallback');
      });

      it('should classify high intent based on keywords', async () => {
        const input = {
          email: 'ceo@bigcompany.com',
          message: 'I am interested in your premium fitness program. Please contact me to discuss pricing and availability.',
          firstName: 'Jane',
          lastName: 'Smith',
          company: 'Big Corp',
          position: 'CEO',
          verified: true,
        };

        const result = await (agent as any).processWithFallback(input);

        expect(['high', 'medium']).toContain(result.intent);
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('extractSentinelResult', () => {
    const { extractSentinelResult } = require('../../server/ai/agents/sentinel.agent');

    it('should extract valid results', () => {
      const validResult = {
        sanitized: true,
        spam: false,
        confidence: 0.8,
      };

      const result = extractSentinelResult(validResult);
      expect(result).toEqual({
        sanitized: true,
        spam: false,
        confidence: 0.8,
      });
    });

    it('should return null for invalid results', () => {
      expect(extractSentinelResult(null)).toBeNull();
      expect(extractSentinelResult({})).toBeNull();
      expect(extractSentinelResult({ sanitized: 'invalid' })).toBeNull();
      expect(extractSentinelResult({ spam: true })).toBeNull();
    });
  });

  describe('extractIntentResult', () => {
    const { extractIntentResult } = require('../../server/ai/agents/intent.agent');

    it('should extract valid intent results', () => {
      const validResult = {
        intent: 'high',
        confidence: 0.9,
        reasoning: 'Strong purchase intent detected',
        userReply: 'Thank you for your interest!',
      };

      const result = extractIntentResult(validResult);
      expect(result).toEqual(validResult);
    });

    it('should return null for invalid results', () => {
      expect(extractIntentResult(null)).toBeNull();
      expect(extractIntentResult({})).toBeNull();
      expect(extractIntentResult({ intent: 'invalid' })).toBeNull();
      expect(extractIntentResult({ confidence: 'not-a-number' })).toBeNull();
    });

    it('should validate intent enum values', () => {
      expect(extractIntentResult({ intent: 'high', confidence: 0.8, reasoning: 'test', userReply: 'ok' })).toBeTruthy();
      expect(extractIntentResult({ intent: 'invalid', confidence: 0.8, reasoning: 'test', userReply: 'ok' })).toBeNull();
    });
  });
});