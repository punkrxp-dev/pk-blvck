/**
 * Enrichment Tool
 * Uses Hunter.io to enrich lead data
 */

import { log } from '../../utils/logger';

export interface EnrichedLeadData {
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  linkedin?: string;
  phone?: string;
  verified?: boolean;
}

export async function enrichLead(email: string): Promise<EnrichedLeadData> {
  const hunterApiKey = process.env.HUNTER_API_KEY;

  // If Hunter API key is configured, use real API
  if (hunterApiKey) {
    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${hunterApiKey}`
      );

      if (!response.ok) {
        log(
          `Hunter.io API error: ${response.status}, falling back to mock data`,
          'enrichment',
          'warn'
        );
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
      log(
        `Error calling Hunter.io API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'enrichment',
        'error'
      );
      return getMockEnrichedData(email);
    }
  }

  // Mock data for development
  log('Using mock enriched data (HUNTER_API_KEY not configured)', 'enrichment');
  return getMockEnrichedData(email);
}

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
