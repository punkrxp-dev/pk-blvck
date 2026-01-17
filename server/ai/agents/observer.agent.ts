
import { BaseAgent } from './base.agent';
import { PresenceLayerOutput } from '../mcp/types';
import { enrichLead } from '../tools/enrichment.tool';
import { z } from 'zod';
import { log } from '../../utils/logger';
import { validateAgentInput } from '../tools/validation.tool';

// Input validation schema
const observerInputSchema = z.object({
    email: z.string().email('Formato de email inválido').max(254, 'Email muito longo'),
}).strict();

export class ObserverAgent extends BaseAgent<{ email: string }, PresenceLayerOutput> {
    constructor() {
        super({
            name: 'Observer',
            requiresAI: false, // Primarily a tool-based agent, but fits the architecture
            fallbackEnabled: true,
            confidenceThreshold: 1.0
        });
    }

    // Since requiresAI is false, process() skips processWithAI and goes to processWithFallback?
    // Let's check BaseAgent logic.
    // if (this.config.requiresAI) { ... } else { processWithFallback }
    // So if I set requiresAI: false, it calls processWithFallback.
    // But I want to use the tool as the "primary" method. 
    // Maybe I should set requiresAI: true but implement it as tool call?
    // No, let's use processWithFallback as the "Tool Execution" if AI isn't needed for reasoning.
    // Or I can force AI to be true and just return the tool result.
    // Let's stick to: AI isn't needed to call an API.

    protected async processWithAI(input: { email: string }) {
        // Not used if requiresAI is false
        return this.processWithFallback(input);
    }

    protected async processWithFallback(input: { email: string }): Promise<PresenceLayerOutput> {
        const data = await enrichLead(input.email);

        return {
            firstName: data.firstName,
            lastName: data.lastName,
            company: data.company,
            position: data.position,
            linkedin: data.linkedin,
            phone: data.phone,
            verified: data.verified || false,
            dataSource: process.env.HUNTER_API_KEY ? 'hunter' : 'mock'
        };
    }

    protected validate(input: { email: string }): boolean {
        try {
            // Enhanced security validation for presence layer
            const validation = validateAgentInput({
                email: input.email,
                message: undefined,
                firstName: undefined,
                lastName: undefined,
                company: undefined,
                position: undefined,
                phone: undefined,
                linkedin: undefined,
            });

            if (!validation.isValid) {
                log(`Validação de segurança falhou: ${validation.issues.join(', ')}`, 'ObserverAgent', 'warn');

                // Log security issues for monitoring
                if (validation.security.emailSecurity.isSuspicious) {
                    log(`Email suspeito detectado: ${input.email} - ${validation.security.emailSecurity.issues.join(', ')}`, 'ObserverAgent', 'warn');
                }

                return false;
            }

            // Legacy Zod validation for backward compatibility
            observerInputSchema.parse(input);

            return true;

        } catch (error) {
            log(`Validação Observer falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'ObserverAgent', 'error');
            return false;
        }
    }
}
