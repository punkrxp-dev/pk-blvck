import { log } from '../utils/logger';
import { openaiCircuitBreaker, googleCircuitBreaker } from './circuit-breaker';

/**
 * AI Models Configuration with Lazy Loading
 *
 * This module exports configured AI model instances for use throughout the application.
 * Models are loaded lazily to reduce initial bundle size and improve cold start times.
 */

// Cache for loaded models
let primaryModel: any = null;
let fallbackModel: any = null;

/**
 * Validate required API keys
 */
function validateApiKeys() {
  if (!process.env.OPENAI_API_KEY) {
    log('OPENAI_API_KEY not found in environment variables', 'models', 'warn');
  }

  if (!process.env.GOOGLE_API_KEY) {
    log('GOOGLE_API_KEY not found in environment variables', 'models', 'warn');
  }
}

/**
 * Primary AI Model: GPT-4o (OpenAI) - Lazy loaded
 *
 * Use this for:
 * - Complex reasoning tasks
 * - Code generation
 * - Long-form content
 * - High-quality responses
 */
export async function getPrimaryModel() {
  if (!primaryModel) {
    const { openai } = await import('@ai-sdk/openai');
    primaryModel = openai('gpt-4o');
    log('Primary model (GPT-4o) loaded', 'models', 'info');
  }
  return primaryModel;
}

/**
 * Fallback AI Model: Gemini 2.0 Flash (Google) - Lazy loaded
 *
 * Use this for:
 * - Fast responses
 * - Cost optimization
 * - Fallback when OpenAI is unavailable
 * - High-throughput scenarios
 */
export async function getFallbackModel() {
  if (!fallbackModel) {
    const { google } = await import('@ai-sdk/google');
    fallbackModel = google('gemini-2.0-flash-exp');
    log('Fallback model (Gemini 2.0 Flash) loaded', 'models', 'info');
  }
  return fallbackModel;
}

/**
 * Model Selection Helper - Async version
 *
 * Automatically selects the appropriate model based on availability
 * and task requirements.
 *
 * @param preferPrimary - Whether to prefer the primary model (default: true)
 * @returns Promise of the selected model instance
 */
export async function selectModel(preferPrimary: boolean = true) {
  if (preferPrimary && process.env.OPENAI_API_KEY) {
    return await getPrimaryModel();
  }

  if (process.env.GOOGLE_API_KEY) {
    return await getFallbackModel();
  }

  throw new Error('No AI model API keys configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY');
}

/**
 * Legacy synchronous exports removed for bundle size optimization
 * All code must now use the async getPrimaryModel() and getFallbackModel() functions
 */

/**
 * Protected generateObject with OpenAI circuit breaker
 */
export async function generateObjectWithOpenAI(schema: any, prompt: string, options?: any) {
  return openaiCircuitBreaker.execute(async () => {
    const { generateObject } = await import('ai');
    const model = await getPrimaryModel();
    return generateObject({
      model,
      schema,
      prompt,
      ...options,
    });
  });
}

/**
 * Protected generateObject with Google circuit breaker
 */
export async function generateObjectWithGoogle(schema: any, prompt: string, options?: any) {
  return googleCircuitBreaker.execute(async () => {
    const { generateObject } = await import('ai');
    const model = await getFallbackModel();
    return generateObject({
      model,
      schema,
      prompt,
      ...options,
    });
  });
}

/**
 * Check if AI models are properly configured
 *
 * @returns Object with configuration status
 */
export function checkAIConfig() {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
    hasAnyModel: !!(process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY),
  };
}

// Initialize validation on module load
validateApiKeys();
