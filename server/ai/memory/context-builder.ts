
import { vectorStore } from './vector-store';
import { MemoryContext, SimilarLead } from '../mcp/types';
import { contextCache, generateContextKey } from './cache';
import { log } from '../../utils/logger';

/**
 * Builds the context object for a new lead by querying the vector store
 * for similar past interactions. Uses intelligent caching for performance.
 */
export async function getMemoryContext(
    leadEmail: string,
    message: string
): Promise<MemoryContext> {
    const cacheKey = generateContextKey(leadEmail, message);

    // Check cache first
    const cachedContext = contextCache.get(cacheKey);
    if (cachedContext) {
        log('Context cache hit', 'memory', 'info');
        return cachedContext;
    }

    log('Context cache miss, querying vector store', 'memory', 'info');
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

    // Extract domain from email for account context
    const domain = leadEmail.split('@')[1] || 'unknown.com';

    const context: MemoryContext = {
        leadId: '', // Will be set by caller if needed
        embedding: [], // Could be populated with actual embedding if needed
        similarLeads,
        accountContext: {
            domain,
            totalLeads: similarLeads.length, // Rough estimate
            avgIntent: similarLeads.length > 0
                ? similarLeads[0].intent // Use most similar intent as average
                : 'unknown',
            lastInteraction: similarLeads.length > 0
                ? similarLeads[0].processedAt
                : new Date().toISOString()
        }
    };

    // Cache the result for future use
    contextCache.set(cacheKey, context, {
        ttl: 60 * 60 * 1000, // 1 hour TTL
    });

    return context;
}
