
import { BaseAgent } from './base.agent';
import { EntryLayerOutput } from '../mcp/types';
import { generateObject } from 'ai';
import { z } from 'zod';
import { primaryModel, fallbackModel } from '../models'; // Assuming these exist from legacy

const SentinelSchema = z.object({
    sanitized: z.boolean(),
    spam: z.boolean(),
    confidence: z.number(),
    reasoning: z.string().optional()
});

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
        const { object } = await generateObject({
            model: primaryModel,
            schema: SentinelSchema,
            prompt: `Analyze this lead for SPAM or SECURITY threats.
      Email: ${input.email}
      Message: ${input.message || 'No message'}
      Source: ${input.source}
      
      Is this spam? Is the input safe?
      `
        });

        return {
            email: input.email,
            source: input.source,
            rawMessage: input.message,
            sanitized: object.sanitized,
            spam: object.spam,
            confidence: object.confidence
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

    protected validate(input: { email: string }) {
        return !!input.email;
    }
}
