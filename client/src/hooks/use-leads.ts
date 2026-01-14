/**
 * useLeads Hook - TanStack Query
 *
 * Custom hook for fetching and managing leads data
 * Features:
 * - Auto-refresh every 5 seconds (polling)
 * - Filtering by status and intent
 * - Statistics included
 */

import { useQuery } from '@tanstack/react-query';

// ========================================
// TYPES
// ========================================

export interface Lead {
  id: string;
  email: string;
  rawMessage: string | null;
  source: string;
  enrichedData: {
    firstName?: string;
    lastName?: string;
    company?: string;
    position?: string;
    linkedin?: string;
    phone?: string;
    verified?: boolean;
  } | null;
  aiClassification: {
    intent: 'high' | 'medium' | 'low' | 'spam';
    confidence: number;
    reasoning?: string;
    model: 'gpt-4o' | 'gemini-2.0-flash';
    processedAt: string;
  } | null;
  status: string;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadsStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  spam: number;
  processedToday: number;
}

export interface LeadsResponse {
  success: boolean;
  data: Lead[];
  stats: LeadsStats;
  meta: {
    count: number;
    limit: number;
    filters: {
      status: string | null;
      intent: string | null;
    };
  };
}

export interface UseLeadsOptions {
  status?: string;
  intent?: string;
  limit?: number;
  refetchInterval?: number;
}

// ========================================
// HOOK
// ========================================

/**
 * Fetches leads from the API
 */
async function fetchLeads(options: UseLeadsOptions = {}): Promise<LeadsResponse> {
  const params = new URLSearchParams();

  if (options.status) params.append('status', options.status);
  if (options.intent) params.append('intent', options.intent);
  if (options.limit) params.append('limit', options.limit.toString());

  // Use API URL from environment or fallback to local development
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const url = `${apiBaseUrl}/api/mcp/leads${params.toString() ? `?${params.toString()}` : ''}`;

  // console.log('🔗 Final URL:', url); // Debug removed

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch leads');
  }

  return response.json();
}

/**
 * Custom hook for fetching leads with auto-refresh
 *
 * @param options - Filtering and polling options
 * @returns TanStack Query result with leads data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useLeads({
 *   intent: 'high',
 *   refetchInterval: 5000
 * });
 * ```
 */
export function useLeads(options: UseLeadsOptions = {}) {
  const { refetchInterval = 5000, ...filterOptions } = options;

  return useQuery({
    queryKey: ['leads', filterOptions],
    queryFn: () => fetchLeads(filterOptions),
    refetchInterval, // Auto-refresh every 5 seconds
    staleTime: 4000, // Consider data stale after 4 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook specifically for high-intent leads
 */
export function useHighIntentLeads() {
  return useLeads({ intent: 'high' });
}

/**
 * Hook for today's processed leads
 */
export function useTodayLeads() {
  return useLeads({ status: 'processed' });
}
// console.log('VITE_API_URL:', import.meta.env.VITE_API_URL); // Debug removed
