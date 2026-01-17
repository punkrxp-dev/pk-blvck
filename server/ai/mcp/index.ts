import { v4 as uuidv4 } from 'uuid';
import {
  LeadInput,
  ProcessedLead,
  ProcessingMetadata,
  ProcessingMode,
  ModelName,
  EntryLayerOutput,
} from './types';
import { vectorStore } from '../memory';
import { IntentAgent } from '../agents/intent.agent';
import { SentinelAgent } from '../agents/sentinel.agent';
import { ObserverAgent } from '../agents/observer.agent';
import { log } from '../../utils/logger';

export class MCPCoordinator {
  private intentAgent: IntentAgent;
  private sentinelAgent: SentinelAgent;
  private observerAgent: ObserverAgent;

  constructor() {
    this.intentAgent = new IntentAgent();
    this.sentinelAgent = new SentinelAgent();
    this.observerAgent = new ObserverAgent();

    log('MCP: Cognitive Pipeline Initialized', 'mcp-coordinator');
  }

  /**
   * Main entry point for processing a lead
   */
  async processLead(input: LeadInput): Promise<ProcessedLead> {
    const startTime = Date.now();
    const leadId = uuidv4();

    // 1. Initialize Pipeline State
    const metadata: ProcessingMetadata = {
      processingMode: 'llm', // Start with LLM assumption
      modelProvider: 'openai',
      actualModel: 'gpt-4o',
      fallbackUsed: false,
      requiresHumanReview: false,
      processingTimeMs: 0,
      timestamp: new Date().toISOString(),
      layers: {},
    };

    try {
      // 2. ENTRY LAYER (Sentinel) - Validates and sanitizes
      const entryResult = await this.sentinelAgent.process({
        email: input.email,
        message: input.message,
        source: input.source,
      });
      metadata.layers.entry = entryResult.metadata;

      if (entryResult.output.spam) {
        return this.buildOutput(leadId, input, metadata, 'failed', entryResult.output);
      }

      // 3. PRESENCE LAYER (Observer) - Enriches data
      const presenceResult = await this.observerAgent.process({
        email: entryResult.output.email,
      });
      metadata.layers.presence = presenceResult.metadata;

      // 4. INTENT LAYER (Intent) - Classifies intent
      // Usage: intent agent might need presence data?
      // The current IntentInput doesn't strictly match all enriched fields but we can pass what matches or extend IntentInput.
      // IntentAgent input: { email, message, firstName?, company?, position?, verified }

      const intentInput = {
        email: entryResult.output.email,
        message: entryResult.output.rawMessage || '',
        firstName: presenceResult.output.firstName,
        company: presenceResult.output.company,
        position: presenceResult.output.position,
        verified: presenceResult.output.verified,
      };

      const intentResult = await this.intentAgent.process(intentInput);
      metadata.layers.intent = intentResult.metadata;

      // 5. Finalize Metadata
      metadata.processingTimeMs = Date.now() - startTime;

      // Determine final status
      const status = intentResult.output.intent === 'spam' ? 'failed' : 'processed';

      const processedLead: ProcessedLead = {
        id: leadId,
        email: input.email,
        entry: entryResult.output,
        presence: presenceResult.output,
        intent: intentResult.output,
        processing: metadata,
        status,
        notified: false,
      };

      // 6. Async Memory Storage (Fire and Forget)
      this.saveToMemory(processedLead);

      return processedLead;
    } catch (error) {
      log(
        `MCP Pipeline Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mcp-coordinator',
        'error'
      );

      // Return a basic failed state
      return {
        id: leadId,
        email: input.email,
        entry: {
          email: input.email,
          source: input.source,
          sanitized: false,
          spam: false,
          confidence: 0,
        },
        presence: { verified: false, dataSource: 'unavailable' },
        intent: {
          intent: 'low',
          confidence: 0,
          reasoning: 'Pipeline crash',
          userReply: 'Erro interno.',
        },
        processing: {
          ...metadata,
          processingMode: 'fallback',
          requiresHumanReview: true,
        },
        status: 'failed',
        notified: false,
      };
    }
  }

  private async saveToMemory(lead: ProcessedLead) {
    // Add to vector store for future context
    if (lead.intent.intent !== 'spam') {
      await vectorStore.add({
        id: lead.id,
        content: `${lead.email} ${lead.intent.userReply}`,
        metadata: {
          email: lead.email,
          intent: lead.intent.intent,
          processedAt: lead.processing.timestamp,
        },
      });
    }
  }

  private buildOutput(
    leadId: string,
    input: LeadInput,
    metadata: ProcessingMetadata,
    status: ProcessedLead['status'],
    entryOutput: EntryLayerOutput
  ): ProcessedLead {
    // Helper to return early
    return {
      id: leadId,
      email: input.email,
      entry: entryOutput,
      presence: { verified: false, dataSource: 'unavailable' },
      intent: { intent: 'spam', confidence: 1, reasoning: 'Blocked by Sentinel', userReply: '' },
      processing: metadata,
      status: 'failed',
      notified: false,
    };
  }
}

export const mcp = new MCPCoordinator();
