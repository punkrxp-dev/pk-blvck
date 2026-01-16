
/**
 * MCP (Model Context Protocol) Pipeline
 * 
 * Orquestra o fluxo cognitivo de ponta a ponta usando o coordinator central.
 */

import { LeadInput, ProcessedLead } from './types';
import { mcp } from './index';
import { saveLead, notifyLead } from '../tools';

/**
 * processLeadPipeline
 * 
 * O ponto de entrada principal, agora delegando para o MCP Coordinator.
 */
export async function processLeadPipeline(input: LeadInput): Promise<ProcessedLead> {
    const startTimeMs = Date.now();
    console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎸 NEO MCP PIPELINE - Processing Started');
    console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${input.email}`);

    try {
        // 1. Core Cognitive Processing (Sentinel -> Observer -> Intent)
        const result = await mcp.processLead(input);

        // 2. Action Layer (Persistence)
        console.log('⚡ ACTION LAYER: Saving to Database...');
        const savedLead = await saveLead({
            email: result.email,
            rawMessage: input.message,
            source: input.source,
            enrichedData: result.presence,
            aiClassification: {
                intent: result.intent.intent,
                confidence: result.intent.confidence,
                reasoning: result.intent.reasoning,
                userReply: result.intent.userReply,
                model: 'gpt-4o', // This should be dynamic from result, but using default for now to match interface
                processedAt: result.processing.timestamp
            },
            processingMetadata: result.processing,
            status: result.status
        });

        // 3. Notification Layer
        let notified = false;
        if (result.status !== 'failed') {
            console.log('⚡ ACTION LAYER: Notifying...');
            notified = await notifyLead(result.email, result.intent.intent);
        }

        console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎉 NEO MCP PIPELINE - Completed in ${Date.now() - startTimeMs}ms`);
        console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            ...result,
            id: savedLead.id, // Ensure we return the DB ID
            notified
        };

    } catch (error) {
        console.error('❌ NEO MCP PIPELINE - Fatal Error:', error);
        throw error;
    }
}
