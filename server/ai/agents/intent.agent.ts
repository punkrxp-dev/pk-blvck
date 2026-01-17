/**
 * Intent Analysis Agent
 *
 * Responsável por classificar a intenção do lead.
 * Usa memória vetorial para contexto histórico.
 */

import { z } from 'zod';
import { BaseAgent } from './base.agent';
import { generateObjectWithOpenAI, generateObjectWithGoogle } from '../models';
import { IntentLayerOutput, MemoryContext } from '../mcp/types';
import { getMemoryContext } from '../memory';
import { loadPrompt } from '../prompts';
import { log } from '../../utils/logger';
import { validateAgentInput } from '../tools/validation.tool';

// ========================================
// INPUT/OUTPUT
// ========================================

export interface IntentInput {
  email: string;
  message?: string;
  firstName?: string;
  company?: string;
  position?: string;
  verified?: boolean;
}

// Input validation schema
const intentInputSchema = z
  .object({
    email: z.string().email('Formato de email inválido').max(254, 'Email muito longo'),
    message: z.string().max(10000, 'Mensagem muito longa').optional(),
    firstName: z.string().max(100, 'Nome muito longo').optional(),
    company: z.string().max(200, 'Nome da empresa muito longo').optional(),
    position: z.string().max(200, 'Cargo muito longo').optional(),
    verified: z.boolean().optional(),
  })
  .strict();

// ========================================
// SCHEMA
// ========================================

const intentSchema = z.object({
  intent: z.enum(['high', 'medium', 'low', 'spam']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  userReply: z.string().max(100),
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Safely extract intent result from AI response
 */
function extractIntentResult(result: unknown): {
  intent: 'high' | 'medium' | 'low' | 'spam';
  confidence: number;
  reasoning: string;
  userReply: string;
} | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const obj = result as Record<string, unknown>;

  // Validate required fields exist and have correct types
  if (
    typeof obj.intent !== 'string' ||
    !['high', 'medium', 'low', 'spam'].includes(obj.intent) ||
    typeof obj.confidence !== 'number' ||
    typeof obj.reasoning !== 'string' ||
    typeof obj.userReply !== 'string'
  ) {
    return null;
  }

  return {
    intent: obj.intent as 'high' | 'medium' | 'low' | 'spam',
    confidence: obj.confidence,
    reasoning: obj.reasoning,
    userReply: obj.userReply,
  };
}

// ========================================
// AGENT
// ========================================

export class IntentAgent extends BaseAgent<IntentInput, IntentLayerOutput> {
  constructor() {
    super({
      name: 'IntentAgent',
      requiresAI: true,
      fallbackEnabled: true,
      confidenceThreshold: 0.7,
    });
  }

  // ========================================
  // AI PROCESSING
  // ========================================

  protected async processWithAI(input: IntentInput): Promise<IntentLayerOutput> {
    // 1. Buscar contexto de memória
    const memoryContext = await this.getMemoryContext(input);

    // 2. Construir prompt com contexto
    const prompt = await this.buildPrompt(input, memoryContext);

    // 3. Tentar GPT-4o
    try {
      const result = await generateObjectWithOpenAI(intentSchema, prompt);
      const intentResult = extractIntentResult(result.object);

      return {
        intent: intentResult?.intent ?? 'low',
        confidence: intentResult?.confidence ?? 0.0,
        reasoning: intentResult?.reasoning ?? 'Falha na análise de intenção',
        userReply: intentResult?.userReply ?? 'Obrigado pelo contato.',
        similarLeads: memoryContext.similarLeads.map(l => l.id),
      };
    } catch (primaryError) {
      log(
        `GPT-4o failed (${primaryError instanceof Error ? primaryError.message : 'Unknown'}), trying Gemini...`,
        'IntentAgent',
        'warn'
      );

      // 4. Fallback para Gemini
      const result = await generateObjectWithGoogle(intentSchema, prompt);
      const intentResult = extractIntentResult(result.object);

      return {
        intent: intentResult?.intent ?? 'low',
        confidence: intentResult?.confidence ?? 0.0,
        reasoning: intentResult?.reasoning ?? 'Análise realizada com modelo alternativo',
        userReply: intentResult?.userReply ?? 'Obrigado pelo contato.',
        similarLeads: memoryContext.similarLeads.map(l => l.id),
      };
    }
  }

  // ========================================
  // FALLBACK (RULE-BASED)
  // ========================================

  protected async processWithFallback(input: IntentInput): Promise<IntentLayerOutput> {
    const message = (input.message || '').toLowerCase();

    // Keywords de alta intenção (PT/EN)
    const highIntentKeywords = [
      'preço',
      'valor',
      'comprar',
      'agendar',
      'demo',
      'price',
      'buy',
      'purchase',
      'quote',
      'custo',
    ];

    // Keywords de spam
    const spamKeywords = ['viagra', 'casino', 'lottery', 'prince', 'inheritance'];

    let intent: IntentLayerOutput['intent'] = 'low';
    let reasoning = 'Rule-based classification (AI unavailable)';

    // 1. Check spam
    if (spamKeywords.some(kw => message.includes(kw)) || !input.message) {
      intent = 'spam';
      reasoning = 'Spam patterns detected';
    }
    // 2. Check high intent
    else if (
      highIntentKeywords.some(kw => message.includes(kw)) ||
      (input.position || '').toLowerCase().includes('ceo') ||
      (input.position || '').toLowerCase().includes('founder')
    ) {
      intent = 'high';
      reasoning = 'High-intent keywords or senior position detected';
    }
    // 3. Check verified
    else if (input.verified) {
      intent = 'medium';
      reasoning = 'Verified email with valid message';
    }

    return {
      intent,
      confidence: 0.3, // Sempre baixa confiança no fallback
      reasoning,
      userReply: this.getDefaultReply(intent),
    };
  }

  // ========================================
  // VALIDATION
  // ========================================

  protected validate(input: IntentInput): boolean {
    try {
      // Enhanced security validation
      const validation = validateAgentInput(input);

      if (!validation.isValid) {
        log(
          `Validação de segurança falhou: ${validation.issues.join(', ')}`,
          'IntentAgent',
          'warn'
        );

        // Log security issues for monitoring
        if (validation.security.emailSecurity.isSuspicious) {
          log(
            `Email suspeito detectado: ${input.email} - ${validation.security.emailSecurity.issues.join(', ')}`,
            'IntentAgent',
            'warn'
          );
        }

        if (!validation.security.contentSecurity.isSafe) {
          log(
            `Conteúdo suspeito detectado: ${validation.security.contentSecurity.threats.join(', ')}`,
            'IntentAgent',
            'warn'
          );
        }

        return false;
      }

      // Legacy Zod validation for backward compatibility
      intentInputSchema.parse(input);

      return true;
    } catch (error) {
      log(
        `Validação de entrada falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'IntentAgent',
        'error'
      );
      return false;
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  private async getMemoryContext(input: IntentInput): Promise<MemoryContext> {
    try {
      return await getMemoryContext(input.email, input.message || '');
    } catch (error) {
      log('Memory unavailable, using empty context', 'IntentAgent', 'warn');
      return {
        leadId: '',
        embedding: [],
        similarLeads: [],
      };
    }
  }

  private async buildPrompt(input: IntentInput, memory: MemoryContext): Promise<string> {
    const template = await loadPrompt('intent-classification');

    // Contexto de leads similares
    const similarContext =
      memory.similarLeads.length > 0
        ? `\n\nSIMILAR PAST LEADS:\n${memory.similarLeads
            .map(l => `- ${l.email} (${l.intent}, ${Math.round(l.similarity * 100)}% similar)`)
            .join('\n')}`
        : '';

    return template
      .replace('{{EMAIL}}', input.email)
      .replace('{{MESSAGE}}', input.message || 'No message provided')
      .replace('{{NAME}}', `${input.firstName || 'Unknown'} ${input.company || ''}`)
      .replace('{{POSITION}}', input.position || 'Unknown')
      .replace('{{VERIFIED}}', input.verified ? 'Yes' : 'No')
      .replace('{{SIMILAR_CONTEXT}}', similarContext);
  }

  private getDefaultReply(intent: IntentLayerOutput['intent']): string {
    // Respostas frias e industriais em Português
    const replies = {
      high: 'Sua ambição foi notada. Estamos observando.',
      medium: 'Registro recebido. O sistema avaliará sua elegibilidade.',
      low: 'Acesso registrado. Aguarde análise.',
      spam: 'Ruído detectado. Acesso negado.',
    };

    return replies[intent];
  }
}
