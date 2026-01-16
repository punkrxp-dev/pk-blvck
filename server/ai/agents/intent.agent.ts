
/**
 * Intent Analysis Agent
 * 
 * Responsável por classificar a intenção do lead.
 * Usa memória vetorial para contexto histórico.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { BaseAgent } from './base.agent';
import { primaryModel, fallbackModel } from '../models';
import { IntentLayerOutput, MemoryContext } from '../mcp/types';
import { getMemoryContext } from '../memory';
import { loadPrompt } from '../prompts';

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
            const result = await generateObject({
                model: primaryModel,
                schema: intentSchema,
                prompt,
            });

            return {
                ...result.object,
                similarLeads: memoryContext.similarLeads.map(l => l.id),
            };
        } catch (primaryError) {
            console.warn('⚠️ GPT-4o failed, trying Gemini...');

            // 4. Fallback para Gemini
            const result = await generateObject({
                model: fallbackModel,
                schema: intentSchema,
                prompt,
            });

            return {
                ...result.object,
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
            'preço', 'valor', 'comprar', 'agendar', 'demo',
            'price', 'buy', 'purchase', 'quote', 'custo',
        ];

        // Keywords de spam
        const spamKeywords = [
            'viagra', 'casino', 'lottery', 'prince', 'inheritance',
        ];

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
        return !!(input.email && input.email.includes('@'));
    }

    // ========================================
    // HELPERS
    // ========================================

    private async getMemoryContext(input: IntentInput): Promise<MemoryContext> {
        try {
            return await getMemoryContext(input.email, input.message || '');
        } catch (error) {
            console.warn('⚠️ Memory unavailable, using empty context');
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
        const similarContext = memory.similarLeads.length > 0
            ? `\n\nSIMILAR PAST LEADS:\n${memory.similarLeads.map(l =>
                `- ${l.email} (${l.intent}, ${Math.round(l.similarity * 100)}% similar)`
            ).join('\n')}`
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
