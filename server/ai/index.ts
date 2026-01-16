/**
 * AI Module - Central export point
 *
 * This module provides easy access to all AI-related functionality.
 */

// Models
export { primaryModel, fallbackModel, selectModel, checkAIConfig } from './models';

// Orchestrator (Heavy Metal Flow)
export { processLead, type LeadInput, type ProcessedLead } from './orchestrator';

// Tools
export {
  enrichLead,
  saveLead,
  notifyLead,
  type EnrichedLeadData,
  type LeadClassification,
} from './tools';
