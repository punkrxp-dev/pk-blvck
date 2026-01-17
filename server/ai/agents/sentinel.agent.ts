import { BaseAgent } from './base.agent';
import { EntryLayerOutput } from '../mcp/types';
import { z } from 'zod';
import { generateObjectWithOpenAI } from '../models';
import { log } from '../../utils/logger';
import { validateAgentInput } from '../tools/validation.tool';

// Type-safe result extraction helper
export function extractSentinelResult(result: unknown): SentinelResult | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const obj = result as Record<string, unknown>;

  // Validate required fields exist and have correct types
  if (
    typeof obj.sanitized !== 'boolean' ||
    typeof obj.spam !== 'boolean' ||
    typeof obj.confidence !== 'number'
  ) {
    return null;
  }

  return {
    sanitized: obj.sanitized,
    spam: obj.spam,
    confidence: obj.confidence,
    reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : undefined,
  };
}

// Input validation schema
const sentinelInputSchema = z
  .object({
    email: z.string().email('Formato de email inválido').max(254, 'Email muito longo'),
    message: z.string().max(10000, 'Mensagem muito longa').optional(),
    source: z.string().min(1, 'Fonte obrigatória').max(50, 'Fonte muito longa'),
  })
  .strict();

const SentinelSchema = z.object({
  sanitized: z.boolean(),
  spam: z.boolean(),
  confidence: z.number(),
  reasoning: z.string().optional(),
});

// Type for the validated result
type SentinelResult = z.infer<typeof SentinelSchema>;

export class SentinelAgent extends BaseAgent<
  { email: string; message?: string; source: string },
  EntryLayerOutput
> {
  constructor() {
    super({
      name: 'Sentinel',
      requiresAI: true,
      fallbackEnabled: true,
      confidenceThreshold: 0.9,
    });
  }

  protected async processWithAI(input: { email: string; message?: string; source: string }) {
    const { object } = await generateObjectWithOpenAI(
      SentinelSchema,
      `Analise este lead para ameaças de SPAM ou SEGURANÇA.
      Email: ${input.email}
      Message: ${input.message || 'No message'}
      Source: ${input.source}

      Is this spam? Is the input safe?
      `
    );

    // Extract result with type safety
    const result = extractSentinelResult(object);

    return {
      email: input.email,
      source: input.source,
      rawMessage: input.message,
      sanitized: result?.sanitized ?? false,
      spam: result?.spam ?? false,
      confidence: result?.confidence ?? 0.0,
    };
  }

  protected async processWithFallback(input: { email: string; message?: string; source: string }) {
    // Use centralized security check for spam keywords
    const security = validateAgentInput({
      email: input.email,
      message: input.message,
    });

    const isSpam = !security.security.contentSecurity.isSafe ||
      security.security.emailSecurity.isSuspicious;

    return {
      email: input.email,
      source: input.source,
      rawMessage: input.message,
      sanitized: true,
      spam: isSpam,
      confidence: 0.5,
      reasoning: isSpam ? `Detected via rules: ${security.security.contentSecurity.threats.join(', ')}` : 'Clean input',
    };
  }

  protected validate(input: { email: string; message?: string; source: string }): boolean {
    try {
      // Enhanced security validation for entry layer
      const validation = validateAgentInput({
        email: input.email,
        message: input.message,
        firstName: undefined,
        lastName: undefined,
        company: undefined,
        position: undefined,
        phone: undefined,
        linkedin: undefined,
      });

      if (!validation.isValid) {
        // Log security issues but ONLY fail validation for serious content threats (XSS/Bash)
        // Spam keywords are handled by the agent's logic, not validation-level blocking.
        const hasSeriousThreats = validation.security.contentSecurity.threats.some(t =>
          t.toLowerCase().includes('script') || t.toLowerCase().includes('sql')
        );

        if (hasSeriousThreats) {
          log(
            `Check de segurança crítico falhou: ${validation.security.contentSecurity.threats.join(', ')}`,
            'SentinelAgent',
            'warn'
          );
          return false;
        }

        // Log other issues but continue
        log(
          `Aviso de validação (prosseguindo): ${validation.issues.join(', ')}`,
          'SentinelAgent',
          'info'
        );
      }

      // Additional source validation
      const allowedSources = ['web', 'api', 'webhook', 'manual', 'test'];
      if (!allowedSources.includes(input.source.toLowerCase().trim())) {
        log(`Fonte inválida: ${input.source}`, 'SentinelAgent', 'warn');
        return false;
      }

      // Legacy Zod validation for backward compatibility
      sentinelInputSchema.parse(input);

      // Check message for obvious spam patterns if provided
      if (input.message) {
        const message = input.message.trim();

        // Check for excessive caps
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.8 && message.length > 10) {
          log(
            `Maiúsculas excessivas detectadas: ${capsRatio.toFixed(2)} proporção`,
            'SentinelAgent',
            'warn'
          );
          return false;
        }

        // Spam keyword checking moved to fallback processing to allow graceful handling
        return true;
      }

      return true;
    } catch (error) {
      log(
        `Validação Sentinel falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'SentinelAgent',
        'error'
      );
      return false;
    }
  }
}
