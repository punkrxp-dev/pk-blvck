
/**
 * Persistence Tool
 * Saves lead data to the database
 */

import { db } from '../../db';
import { leads, type Lead } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { EnrichedLeadData } from './enrichment.tool';

// Re-defining interface locally or importing could work, but using 'any' or flexible types 
// for the JSONB columns is safer unless we strictly type them with schema.
// We will use the schema's type inference primarily.

export async function saveLead(data: {
    email: string;
    rawMessage?: string;
    source: string;
    enrichedData?: EnrichedLeadData;
    aiClassification?: any; // Keep flexible for now or import IntentLayerOutput
    processingMetadata?: any; // processingMetadata from mcp/types
    status?: string;
}): Promise<Lead> {
    try {
        // Check if lead already exists
        const existing = await db.select().from(leads).where(eq(leads.email, data.email)).limit(1);

        if (existing.length > 0) {
            // Update existing lead
            const updated = await db
                .update(leads)
                .set({
                    rawMessage: data.rawMessage || existing[0].rawMessage,
                    enrichedData: data.enrichedData || existing[0].enrichedData,
                    aiClassification: data.aiClassification || existing[0].aiClassification,
                    processingMetadata: data.processingMetadata || existing[0].processingMetadata,
                    status: data.status || existing[0].status,
                    updatedAt: new Date(),
                })
                .where(eq(leads.email, data.email))
                .returning();

            console.log(`✅ Lead updated: ${data.email}`);
            return updated[0];
        } else {
            // Insert new lead
            const inserted = await db
                .insert(leads)
                .values({
                    email: data.email,
                    rawMessage: data.rawMessage,
                    source: data.source,
                    enrichedData: data.enrichedData,
                    aiClassification: data.aiClassification,
                    processingMetadata: data.processingMetadata,
                    status: data.status || 'pending',
                })
                .returning();

            console.log(`✅ Lead created: ${data.email}`);
            return inserted[0];
        }
    } catch (error) {
        console.error('Error saving lead:', error);
        throw new Error(
            `Failed to save lead: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}
