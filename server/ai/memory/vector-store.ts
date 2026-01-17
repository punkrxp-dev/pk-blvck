import { generateEmbedding } from './embeddings';

// Calculates Cosine Similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

/**
 * In-Memory Vector Store
 *
 * Uses cosine similarity to find nearest neighbors.
 * NOTE: In production, this should be replaced by pgvector.
 */
class InMemoryVectorStore {
  private documents: VectorDocument[] = [];

  async add(doc: VectorDocument): Promise<void> {
    if (!doc.embedding) {
      doc.embedding = await generateEmbedding(doc.content);
    }
    this.documents.push(doc);
  }

  async search(
    query: string,
    limit: number = 3
  ): Promise<Array<VectorDocument & { score: number }>> {
    const queryEmbedding = await generateEmbedding(query);

    // Calculate scores
    const results = this.documents.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding!),
    }));

    // Sort by score descending and take top N
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Clear store (useful for testing or resetting state)
  clear() {
    this.documents = [];
  }
}

// Export singleton instance for app-wide use
export const vectorStore = new InMemoryVectorStore();
