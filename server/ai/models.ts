import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

/**
 * AI Models Configuration
 * 
 * This module exports configured AI model instances for use throughout the application.
 * Models are initialized with API keys from environment variables.
 */

// Validate required API keys
if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
}

if (!process.env.GOOGLE_API_KEY) {
    console.warn('⚠️  GOOGLE_API_KEY not found in environment variables');
}

/**
 * Primary AI Model: GPT-4o (OpenAI)
 * 
 * Use this for:
 * - Complex reasoning tasks
 * - Code generation
 * - Long-form content
 * - High-quality responses
 * 
 * @example
 * ```typescript
 * import { primaryModel } from './ai/models';
 * import { generateText } from 'ai';
 * 
 * const result = await generateText({
 *   model: primaryModel,
 *   prompt: 'Explain quantum computing'
 * });
 * ```
 */
export const primaryModel = openai('gpt-4o');

/**
 * Fallback AI Model: Gemini 2.0 Flash (Google)
 * 
 * Use this for:
 * - Fast responses
 * - Cost optimization
 * - Fallback when OpenAI is unavailable
 * - High-throughput scenarios
 * 
 * @example
 * ```typescript
 * import { fallbackModel } from './ai/models';
 * import { generateText } from 'ai';
 * 
 * const result = await generateText({
 *   model: fallbackModel,
 *   prompt: 'Summarize this text'
 * });
 * ```
 */
export const fallbackModel = google('gemini-2.0-flash-exp');

/**
 * Model Selection Helper
 * 
 * Automatically selects the appropriate model based on availability
 * and task requirements.
 * 
 * @param preferPrimary - Whether to prefer the primary model (default: true)
 * @returns The selected model instance
 */
export function selectModel(preferPrimary: boolean = true) {
    if (preferPrimary && process.env.OPENAI_API_KEY) {
        return primaryModel;
    }

    if (process.env.GOOGLE_API_KEY) {
        return fallbackModel;
    }

    throw new Error('No AI model API keys configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY');
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
