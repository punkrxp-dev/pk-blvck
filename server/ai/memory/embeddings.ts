import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { log } from '../../utils/logger';

/**
 * Generates embeddings for a given text using OpenAI's text-embedding-3-small
 * This is the standard model for cost-effective and high-performance embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Clean text to avoid issues with newlines
    const cleanText = text.replace(/\n/g, ' ');

    const result = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: cleanText,
    });

    return result.embedding;
  } catch (error) {
    log(
      `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'embeddings',
      'warn'
    );
    // Return zero vector or handle error appropriately in higher layers
    // For now, rethrow to let the caller decide
    throw error;
  }
}
