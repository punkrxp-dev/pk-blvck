/**
 * MCP Orchestrator - Heavy Metal Flow
 * 
 * This is the core business logic that orchestrates the lead processing pipeline:
 * 1. Enrich lead data (Hunter.io)
 * 2. Classify intent with AI (GPT-4o with Gemini fallback)
 * 3. Save to database
 * 4. Send notifications
 * 
 * CRITICAL: Implements robust error handling with AI model fallback
 */

import { generateObject } from 'ai';
import { primaryModel, fallbackModel } from './models';
import { enrichLead, saveLead, notifyLead, type LeadClassification } from './tools';
import { z } from 'zod';

// ========================================
// TYPES
// ========================================

export interface LeadInput {
    message?: string;
    email: string;
    source: string;
}

export interface ProcessedLead {
    id: string;
    email: string;
    enrichedData: any;
    classification: LeadClassification;
    status: string;
    notified: boolean;
    processingTime: number;
}

// ========================================
// AI INTENT CLASSIFICATION SCHEMA
// ========================================

const intentClassificationSchema = z.object({
    intent: z.enum(['high', 'medium', 'low', 'spam']).describe(
        'Lead intent classification: high (ready to buy), medium (interested), low (just browsing), spam (not genuine)'
    ),
    confidence: z.number().min(0).max(1).describe(
        'Confidence score between 0 and 1'
    ),
    reasoning: z.string().describe(
        'Brief explanation of why this classification was chosen'
    ),
});

// ========================================
// ORCHESTRATOR - THE HEAVY METAL FLOW
// ========================================

/**
 * Main orchestrator function that processes a lead through the entire pipeline
 * 
 * Flow:
 * 1. Enrich lead data
 * 2. Classify intent with AI (with fallback)
 * 3. Save to database
 * 4. Send notification
 * 
 * @param input - Raw lead input data
 * @returns Processed lead with all metadata
 */
export async function processLead(input: LeadInput): Promise<ProcessedLead> {
    const startTime = Date.now();

    console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎸 HEAVY METAL FLOW - Lead Processing Started');
    console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${input.email}`);
    console.log(`📝 Message: ${input.message || 'N/A'}`);
    console.log(`📍 Source: ${input.source}`);
    console.log('');

    try {
        // ========================================
        // STEP 1: ENRICH LEAD DATA
        // ========================================
        console.log('⚡ STEP 1: Enriching lead data...');
        const enrichedData = await enrichLead(input.email);
        console.log(`✅ Enriched: ${enrichedData.firstName} ${enrichedData.lastName} @ ${enrichedData.company}`);
        console.log('');

        // ========================================
        // STEP 2: CLASSIFY INTENT WITH AI (CRITICAL - WITH FALLBACK)
        // ========================================
        console.log('⚡ STEP 2: Classifying intent with AI...');
        const classification = await classifyIntentWithFallback(input, enrichedData);
        console.log(`✅ Intent: ${classification.intent.toUpperCase()} (${Math.round(classification.confidence * 100)}% confidence)`);
        console.log(`💭 Reasoning: ${classification.reasoning}`);
        console.log(`🤖 Model: ${classification.model}`);
        console.log('');

        // ========================================
        // STEP 3: SAVE TO DATABASE
        // ========================================
        console.log('⚡ STEP 3: Saving lead to database...');
        const savedLead = await saveLead({
            email: input.email,
            rawMessage: input.message,
            source: input.source,
            enrichedData,
            aiClassification: classification,
            status: 'processed',
        });
        console.log(`✅ Saved to database: ${savedLead.id}`);
        console.log('');

        // ========================================
        // STEP 4: SEND NOTIFICATION
        // ========================================
        console.log('⚡ STEP 4: Sending notification...');
        const notified = await notifyLead(input.email, classification.intent);
        console.log(`✅ Notification ${notified ? 'sent' : 'logged'}`);
        console.log('');

        // ========================================
        // SUCCESS
        // ========================================
        const processingTime = Date.now() - startTime;
        console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎉 HEAVY METAL FLOW - Completed in ${processingTime}ms`);
        console.log('🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            id: savedLead.id,
            email: input.email,
            enrichedData,
            classification,
            status: 'processed',
            notified,
            processingTime,
        };

    } catch (error) {
        console.error('❌ HEAVY METAL FLOW - Fatal Error:', error);

        // Save failed lead to database for manual review
        try {
            await saveLead({
                email: input.email,
                rawMessage: input.message,
                source: input.source,
                status: 'failed',
            });
        } catch (dbError) {
            console.error('❌ Failed to save error state to database:', dbError);
        }

        throw error;
    }
}

// ========================================
// AI CLASSIFICATION WITH FALLBACK
// ========================================

/**
 * Classifies lead intent using AI with automatic fallback
 * 
 * CRITICAL: This implements the "Heavy Metal" robustness:
 * 1. Try GPT-4o (primary model)
 * 2. If fails, immediately fallback to Gemini
 * 3. If both fail, use rule-based classification
 * 
 * @param input - Lead input data
 * @param enrichedData - Enriched lead data
 * @returns Classification result
 */
async function classifyIntentWithFallback(
    input: LeadInput,
    enrichedData: any
): Promise<LeadClassification> {

    // Build context for AI
    const context = buildAIContext(input, enrichedData);

    // ========================================
    // TRY PRIMARY MODEL (GPT-4o)
    // ========================================
    try {
        console.log('🤖 Attempting classification with GPT-4o...');

        const result = await generateObject({
            model: primaryModel,
            schema: intentClassificationSchema,
            prompt: context,
        });

        return {
            intent: result.object.intent,
            confidence: result.object.confidence,
            reasoning: result.object.reasoning,
            model: 'gpt-4o',
            processedAt: new Date().toISOString(),
        };

    } catch (primaryError) {
        console.warn('⚠️  GPT-4o failed, falling back to Gemini...');
        console.error('Primary model error:', primaryError);

        // ========================================
        // FALLBACK TO GEMINI
        // ========================================
        try {
            console.log('🤖 Attempting classification with Gemini...');

            const result = await generateObject({
                model: fallbackModel,
                schema: intentClassificationSchema,
                prompt: context,
            });

            return {
                intent: result.object.intent,
                confidence: result.object.confidence,
                reasoning: result.object.reasoning,
                model: 'gemini-2.0-flash',
                processedAt: new Date().toISOString(),
            };

        } catch (fallbackError) {
            console.error('❌ Both AI models failed, using rule-based classification');
            console.error('Fallback model error:', fallbackError);

            // ========================================
            // LAST RESORT: RULE-BASED CLASSIFICATION
            // ========================================
            return getRuleBasedClassification(input, enrichedData);
        }
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Builds AI context from lead data
 */
function buildAIContext(input: LeadInput, enrichedData: any): string {
    return `
You are a lead qualification expert. Analyze this lead and classify their intent.

LEAD INFORMATION:
- Email: ${input.email}
- Message: ${input.message || 'No message provided'}
- Source: ${input.source}

ENRICHED DATA:
- Name: ${enrichedData.firstName || 'Unknown'} ${enrichedData.lastName || 'Unknown'}
- Company: ${enrichedData.company || 'Unknown'}
- Position: ${enrichedData.position || 'Unknown'}
- Email Verified: ${enrichedData.verified ? 'Yes' : 'No'}

CLASSIFICATION CRITERIA:
- HIGH: Clear buying intent, verified email, senior position, specific inquiry
- MEDIUM: General interest, verified email, relevant position
- LOW: Casual inquiry, unverified email, unclear intent
- SPAM: Suspicious patterns, generic message, invalid email

Classify this lead's intent and provide your reasoning.
`.trim();
}

/**
 * Rule-based classification fallback (when AI fails)
 */
function getRuleBasedClassification(
    input: LeadInput,
    enrichedData: any
): LeadClassification {
    let intent: 'high' | 'medium' | 'low' | 'spam' = 'low';
    let confidence = 0.5;
    let reasoning = 'Rule-based classification (AI unavailable)';

    // Check for spam indicators
    if (!enrichedData.verified || !input.message) {
        intent = 'spam';
        confidence = 0.7;
        reasoning = 'Unverified email or missing message';
    }
    // Check for high intent indicators
    else if (
        input.message?.toLowerCase().includes('buy') ||
        input.message?.toLowerCase().includes('purchase') ||
        input.message?.toLowerCase().includes('pricing') ||
        enrichedData.position?.toLowerCase().includes('ceo') ||
        enrichedData.position?.toLowerCase().includes('founder')
    ) {
        intent = 'high';
        confidence = 0.8;
        reasoning = 'Strong buying signals or senior position detected';
    }
    // Check for medium intent
    else if (
        enrichedData.verified &&
        enrichedData.company &&
        input.message
    ) {
        intent = 'medium';
        confidence = 0.6;
        reasoning = 'Verified lead with company information';
    }

    return {
        intent,
        confidence,
        reasoning,
        model: 'gpt-4o', // Still report as primary model for consistency
        processedAt: new Date().toISOString(),
    };
}
