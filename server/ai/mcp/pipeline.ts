/**
 * MCP (Model Context Protocol) Pipeline
 *
 * Orquestra o fluxo cognitivo de ponta a ponta usando o coordinator central.
 */

import { LeadInput, ProcessedLead } from './types';
import { mcp } from './index';
import { saveLead, notifyLead } from '../tools';
import { routeAction, logActionDecision } from '../tools/action-router.tool';
import { log } from '../../utils/logger';

/**
 * processLeadPipeline
 *
 * O ponto de entrada principal, agora delegando para o MCP Coordinator.
 */
export async function processLeadPipeline(input: LeadInput): Promise<ProcessedLead> {
  const startTimeMs = Date.now();
  log('NEO MCP PIPELINE - Processing Started', 'mcp-pipeline');
  log(`Email: ${input.email}`, 'mcp-pipeline');

  try {
    // 1. Core Cognitive Processing (Sentinel -> Observer -> Intent)
    const result = await mcp.processLead(input);

    // 2. Action Router (Fluxo Fantasma) - NOVA CAMADA
    log('🕶️ ACTION ROUTER: Deciding action strategy...', 'mcp-pipeline');
    const actionDecision = routeAction({
      intent: result.intent.intent,
      confidence: result.intent.confidence,
      enrichedData: result.presence,
      source: input.source,
      userReply: result.intent.userReply,
    });

    // 3. Action Layer (Persistence)
    log('ACTION LAYER: Saving to Database...', 'mcp-pipeline');
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
        processedAt: result.processing.timestamp,
      },
      processingMetadata: result.processing,
      status: result.status,
    });

    // Log action decision for telemetry
    logActionDecision(actionDecision, savedLead.id);

    // 4. Notification Layer (Baseado na decisão do Action Router)
    let notified = false;
    if (result.status !== 'failed' && actionDecision.executeNow) {
      log(
        `ACTION LAYER: Executing ${actionDecision.action} via ${actionDecision.recommendedChannel}...`,
        'mcp-pipeline'
      );

      // Por enquanto, apenas email é executado automaticamente
      if (actionDecision.recommendedChannel === 'email') {
        notified = await notifyLead(result.email, result.intent.intent);
      } else {
        log(
          `ACTION LAYER: ${actionDecision.action} prepared but not executed (requires manual trigger)`,
          'mcp-pipeline'
        );
      }
    } else {
      log(`ACTION LAYER: Action deferred - ${actionDecision.reasoning}`, 'mcp-pipeline');
    }

    const processingTime = Date.now() - startTimeMs;
    log(`NEO MCP PIPELINE - Completed in ${processingTime}ms`, 'mcp-pipeline');

    return {
      ...result,
      id: savedLead.id, // Ensure we return the DB ID
      notified,
      actionDecision: {
        action: actionDecision.action,
        recommendedChannel: actionDecision.recommendedChannel,
        priority: actionDecision.priority,
        executeNow: actionDecision.executeNow,
        reasoning: actionDecision.reasoning,
      },
    };
  } catch (error) {
    log(
      `NEO MCP PIPELINE - Fatal Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'mcp-pipeline',
      'error'
    );
    throw error;
  }
}
