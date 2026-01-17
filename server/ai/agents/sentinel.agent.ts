
import { BaseAgent } from './base.agent';
import { EntryLayerOutput } from '../mcp/types';
import { z } from 'zod';
import { generateObjectWithOpenAI } from '../models';
import { log } from '../../utils/logger';
import { validateAgentInput } from '../tools/validation.tool';

// Type-safe result extraction helper
function extractSentinelResult(result: unknown): SentinelResult | null {
    if (!result || typeof result !== 'object') {
        return null;
    }

    const obj = result as Record<string, unknown>;

    // Validate required fields exist and have correct types
    if (typeof obj.sanitized !== 'boolean' ||
        typeof obj.spam !== 'boolean' ||
        typeof obj.confidence !== 'number') {
        return null;
    }

    return {
        sanitized: obj.sanitized,
        spam: obj.spam,
        confidence: obj.confidence,
        reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : undefined
    };
}

// Input validation schema
const sentinelInputSchema = z.object({
    email: z.string().email('Formato de email inválido').max(254, 'Email muito longo'),
    message: z.string().max(10000, 'Mensagem muito longa').optional(),
    source: z.string().min(1, 'Fonte obrigatória').max(50, 'Fonte muito longa'),
}).strict();

const SentinelSchema = z.object({
    sanitized: z.boolean(),
    spam: z.boolean(),
    confidence: z.number(),
    reasoning: z.string().optional()
});

// Type for the validated result
type SentinelResult = z.infer<typeof SentinelSchema>;

export class SentinelAgent extends BaseAgent<{ email: string; message?: string; source: string }, EntryLayerOutput> {
    constructor() {
        super({
            name: 'Sentinel',
            requiresAI: true,
            fallbackEnabled: true,
            confidenceThreshold: 0.9
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
            confidence: result?.confidence ?? 0.0
        };
    }

    protected async processWithFallback(input: { email: string; message?: string; source: string }) {
        // Simple regex check for spam
        const spamKeywords = ['casino', 'viagra', 'inheritance', 'prince', 'lottery'];
        const message = (input.message || '').toLowerCase();
        const isSpam = spamKeywords.some(kw => message.includes(kw));

        return {
            email: input.email,
            source: input.source,
            rawMessage: input.message,
            sanitized: true, // Optimistic sanitization
            spam: isSpam,
            confidence: 0.5
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
                log(`Validação de segurança falhou: ${validation.issues.join(', ')}`, 'SentinelAgent', 'warn');

                // Log security issues for monitoring
                if (validation.security.emailSecurity.isSuspicious) {
                    log(`Email suspeito detectado: ${input.email} - ${validation.security.emailSecurity.issues.join(', ')}`, 'SentinelAgent', 'warn');
                }

                if (!validation.security.contentSecurity.isSafe) {
                    log(`Conteúdo suspeito detectado: ${validation.security.contentSecurity.threats.join(', ')}`, 'SentinelAgent', 'warn');
                }

                return false;
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
                    log(`Maiúsculas excessivas detectadas: ${capsRatio.toFixed(2)} proporção`, 'SentinelAgent', 'warn');
                    return false;
                }

                // Check for spam keywords
                const spamKeywords = ['free', 'winner', 'prize', 'urgent', 'act now', 'click here'];
                const lowerMessage = message.toLowerCase();

                for (const keyword of spamKeywords) {
                    if (lowerMessage.includes(keyword)) {
                        log(`Palavra-chave de spam detectada: "${keyword}"`, 'SentinelAgent', 'warn');
                        return false;
                    }
                }
            }

            return true;

        } catch (error) {
            log(`Validação Sentinel falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'SentinelAgent', 'error');
            return false;
        }
    }
}
