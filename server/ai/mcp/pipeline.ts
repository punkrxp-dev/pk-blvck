/**
 * MCP (Model Context Protocol) Pipeline
 * 
 * Orquestra o fluxo cognitivo de ponta a ponta:
 * 1. Enriquecimento de dados (Presença)
 * 2. Análise de intenção e resposta (Intenção)
 * 3. Persistência e Notificação (Ação)
 */

import { LeadInput, ProcessedLead, ProcessingMetadata } from './types';
import { IntentAgent } from '../agents/intent.agent';
import { enrichLead, saveLead, notifyLead } from '../tools';

/**
 * processLeadPipeline
 * 
 * O ponto de entrada principal para novos leads usando a arquitetura refatorada.
 */
export async function processLeadPipeline(input: LeadInput): Promise<ProcessedLead> {
    const startTimeMs = Date.now();
    console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎸 NEO MCP PIPELINE - Processing Started');
    console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${input.email}`);

    try {
        // 1. CAMADA DE PRESENÇA (Enriquecimento)
        console.log('⚡ CAMADA 1: Presença (Hunter.io)...');
        const enrichedData = await enrichLead(input.email);
        console.log(`✅ Dados obtidos para ${enrichedData.company || 'Unknown'}`);

        // 2. CAMADA DE INTENÇÃO (Agente Cognitivo)
        console.log('⚡ CAMADA 2: Intenção (IntentAgent)...');
        const intentAgent = new IntentAgent();
        const intentResult = await intentAgent.execute({
            email: input.email,
            message: input.message || ''
        });

        console.log(`✅ Intenção: ${intentResult.data.intent.toUpperCase()} (${Math.round(intentResult.data.confidence * 100)}%)`);
        console.log(`💭 Sentinel: "${intentResult.data.userReply}"`);

        // 5. CONSTRUIR METADADOS DE PROCESSAMENTO (Calculado antes do save para consistência)
        const totalProcessingTimeMs = Date.now() - startTimeMs;

        const processingMetadata: ProcessingMetadata = {
            ...intentResult.metadata,
            processingTimeMs: totalProcessingTimeMs,
            layers: {
                intent: {
                    agentName: intentResult.stage.name,
                    processingMode: intentResult.metadata.processingMode,
                    modelProvider: intentResult.metadata.modelProvider,
                    modelName: intentResult.metadata.actualModel,
                    confidence: intentResult.data.confidence,
                    durationMs: intentResult.stage.durationMs || 0
                }
            }
        };

        // 3. CAMADA DE AÇÃO (Persistência)
        console.log('⚡ CAMADA 3: Ação (Database/Notificação)...');
        const savedLead = await saveLead({
            email: input.email,
            rawMessage: input.message,
            source: input.source,
            enrichedData,
            aiClassification: {
                intent: intentResult.data.intent,
                confidence: intentResult.data.confidence,
                reasoning: intentResult.data.reasoning,
                userReply: intentResult.data.userReply,
                model: intentResult.metadata.actualModel as any,
                processedAt: intentResult.metadata.timestamp
            },
            processingMetadata: processingMetadata,
            status: 'processed'
        });

        // 4. CAMADA DE NOTIFICAÇÃO
        const notified = await notifyLead(input.email, intentResult.data.intent);

        console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎉 NEO MCP PIPELINE - Completed in ${totalProcessingTimeMs}ms`);
        console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            id: savedLead.id,
            email: input.email,
            entry: {
                email: input.email,
                source: input.source,
                rawMessage: input.message,
                sanitized: true,
                spam: intentResult.data.intent === 'spam',
                confidence: intentResult.data.confidence
            },
            presence: {
                ...enrichedData,
                verified: !!enrichedData.verified,
                dataSource: enrichedData.firstName ? 'hunter' : 'unavailable'
            },
            intent: intentResult.data,
            processing: processingMetadata,
            status: 'processed',
            notified
        };

    } catch (error) {
        console.error('❌ NEO MCP PIPELINE - Fatal Error:', error);

        // Fallback: Tentativa mínima de salvar o erro
        try {
            await saveLead({
                email: input.email,
                rawMessage: input.message,
                source: input.source,
                status: 'failed'
            });
        } catch (dbError) {
            console.error('❌ Failed to save error state:', dbError);
        }

        throw error;
    }
}
