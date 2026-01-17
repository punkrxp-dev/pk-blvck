/**
 * MCP Orchestrator - Neo Mode
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
import { getPrimaryModel, getFallbackModel } from '../models';
import { enrichLead, saveLead, notifyLead, type LeadClassification } from '../tools';
import { z } from 'zod';
import { log } from '../../utils/logger';

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
  intent: z
    .enum(['high', 'medium', 'low', 'spam'])
    .describe(
      'Lead intent classification: high (ready to buy), medium (interested), low (just browsing), spam (not genuine)'
    ),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
  reasoning: z.string().describe('Brief explanation of why this classification was chosen'),
  userReply: z
    .string()
    .describe('A brief, cold, enigmatic message to the user from the Sentinel AI (max 15 words)'),
});

// ========================================
// ORCHESTRATOR - NEO MODE
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

  log('NEO PROTOCOL - Lead Processing Started', 'legacy-orchestrator');
  log(`Email: ${input.email}`, 'legacy-orchestrator');
  log(`Message: ${input.message || 'N/A'}`, 'legacy-orchestrator');
  log(`Source: ${input.source}`, 'legacy-orchestrator');

  try {
    // ========================================
    // STEP 1: ENRICH LEAD DATA
    // ========================================
    log('STEP 1: Enriching lead data...', 'legacy-orchestrator');
    const enrichedData = await enrichLead(input.email);
    log(
      `Enriched: ${enrichedData.firstName} ${enrichedData.lastName} @ ${enrichedData.company}`,
      'legacy-orchestrator'
    );

    // ========================================
    // STEP 2: CLASSIFY INTENT WITH AI (CRITICAL - WITH FALLBACK)
    // ========================================
    log('STEP 2: Classifying intent with AI...', 'legacy-orchestrator');
    const classification = await classifyIntentWithFallback(input, enrichedData);
    log(
      `Intent: ${classification.intent.toUpperCase()} (${Math.round(classification.confidence * 100)}% confidence)`,
      'legacy-orchestrator'
    );
    log(`Reasoning: ${classification.reasoning}`, 'legacy-orchestrator');
    log(`Model: ${classification.model}`, 'legacy-orchestrator');

    // ========================================
    // STEP 3: SAVE TO DATABASE
    // ========================================
    log('STEP 3: Saving lead to database...', 'legacy-orchestrator');
    const savedLead = await saveLead({
      email: input.email,
      rawMessage: input.message,
      source: input.source,
      enrichedData,
      aiClassification: classification,
      status: 'processed',
    });
    log(`Saved to database: ${savedLead.id}`, 'legacy-orchestrator');

    // ========================================
    // STEP 4: SEND NOTIFICATION
    // ========================================
    log('STEP 4: Sending notification...', 'legacy-orchestrator');
    const notified = await notifyLead(input.email, classification.intent);
    log(`Notification ${notified ? 'sent' : 'logged'}`, 'legacy-orchestrator');

    // ========================================
    // SUCCESS
    // ========================================
    const processingTime = Date.now() - startTime;
    log(`NEO PROTOCOL - Completed in ${processingTime}ms`, 'legacy-orchestrator');

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
    log(
      `NEO PROTOCOL - Fatal Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'legacy-orchestrator',
      'error'
    );

    // Save failed lead to database for manual review
    try {
      await saveLead({
        email: input.email,
        rawMessage: input.message,
        source: input.source,
        status: 'failed',
      });
    } catch (dbError) {
      log(
        `Failed to save error state to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        'legacy-orchestrator',
        'error'
      );
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
 * CRITICAL: This implements the NEO PROTOCOL robustness:
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
    log('Attempting classification with GPT-4o...', 'legacy-orchestrator');

    const primaryModel = await getPrimaryModel();
    const result = await generateObject({
      model: primaryModel,
      schema: intentClassificationSchema,
      prompt: context,
    });

    return {
      intent: result.object.intent,
      confidence: result.object.confidence,
      reasoning: result.object.reasoning,
      userReply: result.object.userReply,
      model: 'gpt-4o',
      processedAt: new Date().toISOString(),
    };
  } catch (primaryError) {
    log('GPT-4o failed, falling back to Gemini...', 'legacy-orchestrator', 'warn');
    log(
      `Primary model error: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`,
      'legacy-orchestrator',
      'error'
    );

    // ========================================
    // FALLBACK TO GEMINI
    // ========================================
    try {
      log('Attempting classification with Gemini...', 'legacy-orchestrator');

      const fallbackModel = await getFallbackModel();
      const result = await generateObject({
        model: fallbackModel,
        schema: intentClassificationSchema,
        prompt: context,
      });

      return {
        intent: result.object.intent,
        confidence: result.object.confidence,
        reasoning: result.object.reasoning,
        userReply: result.object.userReply,
        model: 'gemini-2.0-flash-exp' as any,
        processedAt: new Date().toISOString(),
      };
    } catch (fallbackError) {
      log('Both AI models failed, using rule-based classification', 'legacy-orchestrator', 'error');
      log(
        `Fallback model error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
        'legacy-orchestrator',
        'error'
      );

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

Finally, generate a response for the user (userReply). 
PERSONA: You are the Sentinel, an AI from an elite, obscure, and exclusive high-performance facility. 
GUIDELINES:
- Language: Strictly Portuguese (PT-BR).
- Respond in 1 short sentence (max 15 words).
- Tone: Enigmatic, motivating but cold. 
- Rules: Never use emojis. 
- If SPAM: Be ironic/dry.
`.trim();
}

/**
 * Rule-based classification fallback (when AI fails)
 */
function getRuleBasedClassification(input: LeadInput, enrichedData: any): LeadClassification {
  let intent: 'high' | 'medium' | 'low' | 'spam' = 'low';
  let confidence = 0.5;
  let reasoning = 'Rule-based classification (AI unavailable)';

  const message = input.message?.toLowerCase() || '';

  // 1. Check for HIGH/MEDIUM intent via KEYWORD RESCUE (Priority over verification)
  // Keywords: preço, valor, comprar, agendar, funciona, price, buy, demo, custo
  if (
    message.includes('preço') ||
    message.includes('valor') ||
    message.includes('comprar') ||
    message.includes('agendar') ||
    message.includes('funciona') ||
    message.includes('price') ||
    message.includes('buy') ||
    message.includes('demo') ||
    message.includes('custo') ||
    message.includes('purchase') || // Extra safety
    enrichedData.position?.toLowerCase().includes('ceo') ||
    enrichedData.position?.toLowerCase().includes('founder') ||
    enrichedData.position?.toLowerCase().includes('director')
  ) {
    intent = 'high'; // Strong signal -> High Intent
    confidence = 0.85;
    reasoning = 'NEO MODE: Keyword Rescue triggered (High buying signal detected)';
  }
  // 2. Check for SPAM indicators (No message is suspicious)
  else if (!input.message || input.message.length < 5) {
    intent = 'spam';
    confidence = 0.7;
    reasoning = 'Missing or too short message';
  }
  // 3. Check for MEDIUM intent (Verified + Valid Message)
  else if (enrichedData.verified) {
    intent = 'medium';
    confidence = 0.6;
    reasoning = 'Verified lead with valid message';
  }
  // 4. Fallback to LOW
  else {
    intent = 'low';
    confidence = 0.4;
    reasoning = 'Unverified lead with generic message';
  }

  let userReply = 'Registro recebido. O sistema avaliará sua elegibilidade.';
  if (intent === 'high') userReply = 'Sua ambição foi notada. Estamos observando.';
  if (intent === 'spam') userReply = 'Ruído detectado. Acesso negado.';

  return {
    intent,
    confidence,
    reasoning,
    userReply,
    model: 'gpt-4o', // Mock model name for schema compatibility
    processedAt: new Date().toISOString(),
  };
}
