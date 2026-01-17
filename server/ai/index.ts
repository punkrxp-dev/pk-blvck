/**
 * AI Module - Central export point
 *
 * This module provides easy access to all AI-related functionality.
 */

// Models
export {
  getPrimaryModel,
  getFallbackModel,
  selectModel,
  checkAIConfig,
  generateObjectWithOpenAI,
  generateObjectWithGoogle,
} from './models';

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitState,
  openaiCircuitBreaker,
  googleCircuitBreaker,
  getCircuitBreakerStats,
  resetAllCircuitBreakers,
} from './circuit-breaker';

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

// Memory & Cache
export {
  getMemoryContext,
  embeddingCache,
  contextCache,
  responseCache,
  getAllCacheStats,
  cleanupAllCaches,
  clearAllCaches,
} from './memory';
