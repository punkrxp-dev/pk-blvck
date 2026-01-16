
import { vectorStore } from './vector-store';
import { MemoryContext, SimilarLead } from '../mcp/types';

/**
 * Builds the context object for a new lead by querying the vector store
 * for similar past interactions.
 */
export async function getMemoryContext(
    leadEmail: string,
    message: string
): Promise<MemoryContext> {
    const query = `${leadEmail} ${message}`;

    // Search for similar leads
    const results = await vectorStore.search(query, 3);

    const similarLeads: SimilarLead[] = results.map(doc => ({
        id: doc.id,
        email: doc.metadata.email,
        similarity: doc.score,
        intent: doc.metadata.intent || 'unknown',
        processedAt: doc.metadata.processedAt || new Date().toISOString()
    }));

    // In a real scenario, we would also generate an embedding for the current lead here
    // but for the return type we just return an empty array or the classification embedding if needed.
    // We'll leave it empty for now as it's not strictly required for the prompt.

    return {
        leadId: '',
        embedding: [],
        similarLeads,
        accountContext: {
            domain: 'punkblack.com', // Static for now, could catch from config
            totalLeads: 0, // Placeholder
            avgIntent: 'unknown',
            lastInteraction: new Date().toISOString()
        }
    };
}
