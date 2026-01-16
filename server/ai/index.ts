/**
 * AI Module - Central export point
 *
 * This module provides easy access to all AI-related functionality.
 */

// Models
export { primaryModel, fallbackModel, selectModel, checkAIConfig } from './models';

// MCP Pipeline (NΞØ Protocol)
export { processLeadPipeline } from './mcp/pipeline';
export * from './mcp/types';

// Tools
export {
  enrichLead,
  saveLead,
  notifyLead,
  type EnrichedLeadData,
  type LeadClassification,
} from './tools';
