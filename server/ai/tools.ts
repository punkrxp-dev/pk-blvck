/**
 * MCP Tools Layer - Neo Mode Orchestrator
 *
 * This module contains the core tools used by the MCP Orchestrator:
 * - enrichLead: Enriches lead data using Hunter.io (or mock data)
 * - saveLead: Persists lead data to database
 * - notifyLead: Sends notifications via Resend (or mock)
 */

import { db } from '../db';
import { leads, type Lead } from '@shared/schema';
import { eq } from 'drizzle-orm';

// ========================================
// TYPES
// ========================================

export interface EnrichedLeadData {
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  linkedin?: string;
  phone?: string;
  verified?: boolean;
}

export interface LeadClassification {
  intent: 'high' | 'medium' | 'low' | 'spam';
  confidence: number;
  reasoning?: string;
  model: 'gpt-4o' | 'gemini-2.0-flash';
  processedAt: string;
}

// ========================================
// TOOL 1: ENRICH LEAD
// ========================================

/**
 * Enriches lead data using Hunter.io API
 * Falls back to mock data if API key is not configured
 *
 * @param email - Email address to enrich
 * @returns Enriched lead data
 */
export async function enrichLead(email: string): Promise<EnrichedLeadData> {
  const hunterApiKey = process.env.HUNTER_API_KEY;

  // If Hunter API key is configured, use real API
  if (hunterApiKey) {
    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${hunterApiKey}`
      );

      if (!response.ok) {
        console.warn(`Hunter.io API error: ${response.status}, falling back to mock data`);
        return getMockEnrichedData(email);
      }

      const data = await response.json();

      return {
        firstName: data.data?.first_name,
        lastName: data.data?.last_name,
        company: data.data?.sources?.[0]?.domain,
        position: data.data?.position,
        linkedin: data.data?.linkedin,
        phone: data.data?.phone_number,
        verified: data.data?.result === 'deliverable',
      };
    } catch (error) {
      console.error('Error calling Hunter.io API:', error);
      return getMockEnrichedData(email);
    }
  }

  // Mock data for development
  console.log('🔧 Using mock enriched data (HUNTER_API_KEY not configured)');
  return getMockEnrichedData(email);
}

/**
 * Generates mock enriched data for development/testing
 */
function getMockEnrichedData(email: string): EnrichedLeadData {
  const domain = email.split('@')[1] || 'example.com';
  const username = email.split('@')[0] || 'user';

  // Generate realistic mock data based on email
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
  const positions = ['CEO', 'CTO', 'Marketing Director', 'Sales Manager', 'Product Manager'];

  const hashCode = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return {
    firstName: firstNames[hashCode % firstNames.length],
    lastName: lastNames[hashCode % lastNames.length],
    company: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
    position: positions[hashCode % positions.length],
    linkedin: `https://linkedin.com/in/${username}`,
    phone: `+1-555-${String(hashCode % 10000).padStart(4, '0')}`,
    verified: hashCode % 2 === 0, // 50% verified
  };
}

// ========================================
// TOOL 2: SAVE LEAD
// ========================================

/**
 * Saves or updates lead data in the database
 * Uses upsert to handle duplicate emails
 *
 * @param data - Lead data to save
 * @returns Saved lead record
 */
export async function saveLead(data: {
  email: string;
  rawMessage?: string;
  source: string;
  enrichedData?: EnrichedLeadData;
  aiClassification?: LeadClassification;
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

// ========================================
// TOOL 3: NOTIFY LEAD
// ========================================

/**
 * Sends notification email using Resend API
 * Falls back to console log if API key is not configured
 *
 * @param email - Recipient email
 * @param intent - Lead intent classification
 * @returns Success status
 */
export async function notifyLead(
  email: string,
  intent: 'high' | 'medium' | 'low' | 'spam'
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Determine email template based on intent
  const templates = {
    high: {
      subject: '🎯 High-Priority Lead Alert',
      body: `A high-priority lead has been identified: ${email}. Immediate follow-up recommended.`,
    },
    medium: {
      subject: '📊 Medium-Priority Lead',
      body: `A medium-priority lead has been captured: ${email}. Follow-up within 24 hours.`,
    },
    low: {
      subject: '📝 New Lead Captured',
      body: `A new lead has been added: ${email}. Standard follow-up process.`,
    },
    spam: {
      subject: '🚫 Spam Lead Detected',
      body: `Potential spam lead detected: ${email}. Review required.`,
    },
  };

  const template = templates[intent];

  // If Resend API key is configured, send real email
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: process.env.NOTIFICATION_EMAIL || 'admin@example.com',
          subject: template.subject,
          html: `<p>${template.body}</p>`,
        }),
      });

      if (!response.ok) {
        console.warn(`Resend API error: ${response.status}, notification logged only`);
        logNotification(email, intent, template);
        return false;
      }

      console.log(`📧 Email sent via Resend for ${email} (${intent})`);
      return true;
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      logNotification(email, intent, template);
      return false;
    }
  }

  // Mock notification for development
  console.log('🔧 Mock notification (RESEND_API_KEY not configured)');
  logNotification(email, intent, template);
  return true;
}

/**
 * Logs notification to console (fallback)
 */
function logNotification(
  email: string,
  intent: string,
  template: { subject: string; body: string }
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 NOTIFICATION LOG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${email}`);
  console.log(`Intent: ${intent.toUpperCase()}`);
  console.log(`Subject: ${template.subject}`);
  console.log(`Body: ${template.body}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
