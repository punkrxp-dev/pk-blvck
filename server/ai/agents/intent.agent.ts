import { BaseAgent } from './base.agent';
import { IntentLayerOutput } from '../mcp/types';
import { generateObject } from 'ai'; // Vercel AI SDK
import { z } from 'zod';
import { primaryModel, fallbackModel } from '../models'; // Seus modelos existentes

// Schema de Saída (Zod)
const IntentSchema = z.object({
    intent: z.enum(['high', 'medium', 'low', 'spam']),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    userReply: z.string().describe("A short, enigmatic reply to the user in Portuguese"),
});

export class IntentAgent extends BaseAgent<{ message: string; email: string }, IntentLayerOutput> {

    constructor() {
        super({
            name: 'Intent Analyzer',
            description: 'Classifies lead intent and generates reply',
            primaryProvider: 'openai',
            primaryModel: 'gpt-4o',
            fallbackProvider: 'google',
            fallbackModel: 'gemini-2.0-flash-exp'
        });
    }

    // 1. Processamento Principal (GPT-4o)
    protected async process(input: { message: string; email: string }) {
        const { object } = await generateObject({
            model: primaryModel,
            schema: IntentSchema,
            system: `Você é o Sentinel, uma IA da PUNK BLACK. 
               Analise a intenção do lead. Responda o usuário com frieza, exclusividade e autoridade.
               REGRAS DE RESPOSTA (userReply):
               - Idioma: Português (PT-BR).
               - Tom: Industrial, enigmático, motivador mas frio.
               - Comprimento: Máximo 15 palavras.
               - Jamais use emojis.`,
            prompt: `Email: ${input.email}\nMensagem do Lead: ${input.message}`
        });

        return object;
    }

    // 2. Fallback (Gemini)
    protected async processFallback(input: { message: string; email: string }) {
        const { object } = await generateObject({
            model: fallbackModel,
            schema: IntentSchema,
            system: "Você é o sistema de backup do Sentinel (PUNK BLACK). Mantenha a persona fria e enigmática em Português.",
            prompt: `Email: ${input.email}\nMensagem: ${input.message}`
        });
        return object;
    }

    // 3. Regras (Rescue Keyword) - O "Neo Mode" antigo
    protected async processRules(input: { message: string; email: string }): Promise<IntentLayerOutput> {
        const msg = input.message.toLowerCase();
        const keywords = ['preço', 'valor', 'comprar', 'plano', 'gympass', 'custo', 'agendar'];

        const isHighIntent = keywords.some(k => msg.includes(k));

        return {
            intent: isHighIntent ? 'high' : 'low',
            confidence: 1.0, // Regra é certeza
            reasoning: 'Keyword Rescue Protocol Triggered',
            userReply: isHighIntent
                ? 'Sua ambição foi notada. Estamos observando.'
                : 'Registro recebido. O sistema avaliará sua elegibilidade.'
        };
    }
}
