
/**
 * Persistence Tool
 * Saves lead data to the database
 */

import { db } from '../../db';
import { leads, type Lead } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { EnrichedLeadData } from './enrichment.tool';
import { LeadClassification } from '../tools';
import { ProcessingMetadata } from '../mcp/types';
import { log } from '../../utils/logger';

export async function saveLead(data: {
    email: string;
    rawMessage?: string;
    source: string;
    enrichedData?: EnrichedLeadData;
    aiClassification?: LeadClassification;
    processingMetadata?: ProcessingMetadata;
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

            log(`Lead updated: ${data.email}`, 'persistence');
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

            log(`Lead created: ${data.email}`, 'persistence');
            return inserted[0];
        }
    } catch (error) {
        log(
            `Error saving lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'persistence',
            'error'
        );
        throw new Error(
            `Failed to save lead: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}
