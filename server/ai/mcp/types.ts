/**
 * MCP (Model Context Protocol) Types
 * 
 * Define a estrutura formal do pipeline cognitivo.
 */

// ========================================
// PROCESSING MODES & MODELS
// ========================================

export type ProcessingMode = 'llm' | 'fallback' | 'rules';

export type ModelProvider = 'openai' | 'google' | 'rules';

export type ModelName = 'gpt-4o' | 'gemini-2.0-flash-exp' | 'rule-based';

// ========================================
// PIPELINE STAGES
// ========================================

export interface PipelineStage {
    name: string;
    startedAt: string; // ISO String
    completedAt?: string; // ISO String
    durationMs?: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
}

export interface PipelineContext {
    leadId?: string;
    stages: Record<string, PipelineStage>; // Serializável
    metadata: ProcessingMetadata;
}

// ========================================
// PROCESSING METADATA (TRANSPARÊNCIA)
// ========================================

export interface ProcessingMetadata {
    processingMode: ProcessingMode;
    modelProvider: ModelProvider;
    actualModel: ModelName;
    fallbackUsed: boolean;
    requiresHumanReview: boolean;
    processingTimeMs: number; // Padronizado
    timestamp: string; // ISO String

    // Rastreabilidade de cada camada
    layers: Record<string, LayerMetadata>;
}

export interface LayerMetadata {
    agentName: string;
    processingMode: ProcessingMode;
    modelProvider: ModelProvider;
    modelName: ModelName;
    confidence: number;
    durationMs: number; // Padronizado por camada
}

// ========================================
// LEAD INPUT/OUTPUT
// ========================================

export interface LeadInput {
    email: string;
    message?: string;
    source: string;
    metadata?: Record<string, any>;
}

export interface ProcessedLead {
    id: string;
    email: string;

    // Dados de cada camada
    entry: EntryLayerOutput;
    presence: PresenceLayerOutput;
    intent: IntentLayerOutput;

    // Metadados do processamento
    processing: ProcessingMetadata;

    // Status final
    status: 'processed' | 'failed' | 'pending_review';
    notified: boolean;
}

// ========================================
// LAYER OUTPUTS
// ========================================

export interface EntryLayerOutput {
    email: string;
    source: string;
    rawMessage?: string;
    sanitized: boolean;
    spam: boolean;
    confidence: number;
}

export interface PresenceLayerOutput {
    firstName?: string;
    lastName?: string;
    company?: string;
    position?: string;
    linkedin?: string;
    phone?: string;
    verified: boolean;
    dataSource: 'hunter' | 'mock' | 'unavailable';
}

export interface IntentLayerOutput {
    intent: 'high' | 'medium' | 'low' | 'spam';
    confidence: number;
    reasoning: string;
    userReply: string;
    similarLeads?: string[]; // IDs de leads similares (memória)
}

// ========================================
// MEMORY CONTEXT
// ========================================

export interface MemoryContext {
    leadId: string;
    embedding: number[];
    similarLeads: SimilarLead[];
    accountContext?: AccountContext;
}

export interface SimilarLead {
    id: string;
    email: string;
    similarity: number;
    intent: string;
    processedAt: string;
}

export interface AccountContext {
    domain: string;
    totalLeads: number;
    avgIntent: string;
    lastInteraction: string;
}
