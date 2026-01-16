🏗️ Arquitetura Refatorada - server/ai/Vou desenhar a árvore real de arquivos que transforma seu dispatcher em sistema cognitivo.

📁 Nova Estrutura (Incremental, Não Reescrita)

server/ai/
├── index.ts                      # Export central (mantém)
├── models.ts                     # Configuração de modelos (mantém)
│
├── mcp/                          # 🆕 MCP Formal
│   ├── index.ts                  # Orchestrator real
│   ├── pipeline.ts               # Definição do pipeline
│   └── types.ts                  # Tipos do MCP
│
├── agents/                       # 🆕 Agentes com Estado
│   ├── base.agent.ts             # Classe base abstrata
│   ├── sentinel.agent.ts         # Camada de Entrada
│   ├── observer.agent.ts         # Camada de Presença
│   └── intent.agent.ts           # Camada de Intenção
│
├── memory/                       # 🆕 Sistema de Memória
│   ├── index.ts                  # Export da memória
│   ├── vector-store.ts           # Vector store (pgvector/in-memory)
│   ├── embeddings.ts             # Geração de embeddings
│   └── context-builder.ts        # Construtor de contexto
│
├── tools/                        # ♻️ Refatorado (era tools.ts)
│   ├── index.ts                  # Export central
│   ├── enrichment.tool.ts        # Hunter.io
│   ├── persistence.tool.ts       # Database
│   └── notification.tool.ts      # Resend
│
├── prompts/                      # 🆕 Prompts Externalizados
│   ├── personas.json             # Definições de personas
│   ├── intent-classification.md  # Template de classificação
│   └── index.ts                  # Loader de prompts
│
└── legacy/                       # 📦 Código antigo (transição)
    └── orchestrator.ts           # Mover aqui temporariamente

    🔧 Implementação por CamadaVou gerar código real para cada arquivo crítico.1. mcp/types.ts - Tipos do Sistema

    /**
 * MCP (Model Context Protocol) Types
 * 
 * Define a estrutura formal do pipeline cognitivo
 */

// ========================================
// PROCESSING MODES
// ========================================

export type ProcessingMode = 'llm' | 'fallback' | 'rules';

export type ModelName = 'gpt-4o' | 'gemini-2.0-flash' | 'rule-based';

// ========================================
// PIPELINE STAGES
// ========================================

export interface PipelineStage {
  name: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface PipelineContext {
  leadId?: string;
  stages: Map<string, PipelineStage>;
  metadata: ProcessingMetadata;
}

// ========================================
// PROCESSING METADATA (TRANSPARÊNCIA)
// ========================================

export interface ProcessingMetadata {
  processingMode: ProcessingMode;
  actualModel: ModelName;
  fallbackUsed: boolean;
  requiresHumanReview: boolean;
  processingTime: number;
  timestamp: string;
  
  // Rastreabilidade de cada camada
  layers: {
    entry?: LayerMetadata;
    presence?: LayerMetadata;
    intent?: LayerMetadata;
  };
}

export interface LayerMetadata {
  agentName: string;
  processingMode: ProcessingMode;
  confidence: number;
  durationMs: number;
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


2. agents/base.agent.ts - Classe Base para Agentes

/**
 * Base Agent Class
 * 
 * Classe abstrata que define o contrato de todos os agentes.
 * Garante que cada agente tenha:
 * - Estado (memória)
 * - Ciclo de vida
 * - Observabilidade
 * - Fallback explícito
 */

import { ProcessingMode, ModelName, LayerMetadata } from '../mcp/types';

export interface AgentConfig {
  name: string;
  requiresAI: boolean;
  fallbackEnabled: boolean;
  confidenceThreshold: number;
}

export interface AgentContext {
  mode: ProcessingMode;
  model?: ModelName;
  startTime: number;
  metadata: Record<string, any>;
}

export abstract class BaseAgent<TInput, TOutput> {
  protected config: AgentConfig;
  protected context: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = this.initContext();
  }

  // ========================================
  // ABSTRACT METHODS (Cada agente implementa)
  // ========================================

  /**
   * Processamento com IA (LLM)
   */
  protected abstract processWithAI(input: TInput): Promise<TOutput>;

  /**
   * Fallback sem IA (regras/heurísticas)
   */
  protected abstract processWithFallback(input: TInput): Promise<TOutput>;

  /**
   * Validação do input
   */
  protected abstract validate(input: TInput): boolean;

  // ========================================
  // PUBLIC API
  // ========================================

  /**
   * Método principal de processamento
   * Orquestra IA → Fallback → Erro
   */
  async process(input: TInput): Promise<{
    output: TOutput;
    metadata: LayerMetadata;
  }> {
    const startTime = Date.now();

    try {
      // 1. Validar input
      if (!this.validate(input)) {
        throw new Error(`Invalid input for ${this.config.name}`);
      }

      // 2. Tentar com IA
      if (this.config.requiresAI) {
        try {
          const output = await this.processWithAI(input);
          return this.buildResponse(output, 'llm', startTime);
        } catch (aiError) {
          console.warn(`⚠️ AI failed in ${this.config.name}, using fallback`);
          
          if (!this.config.fallbackEnabled) {
            throw aiError;
          }
        }
      }

      // 3. Fallback
      const output = await this.processWithFallback(input);
      return this.buildResponse(output, 'fallback', startTime);

    } catch (error) {
      console.error(`❌ ${this.config.name} failed:`, error);
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private initContext(): AgentContext {
    return {
      mode: 'llm',
      startTime: Date.now(),
      metadata: {},
    };
  }

  private buildResponse(
    output: TOutput,
    mode: ProcessingMode,
    startTime: number
  ): {
    output: TOutput;
    metadata: LayerMetadata;
  } {
    const durationMs = Date.now() - startTime;

    return {
      output,
      metadata: {
        agentName: this.config.name,
        processingMode: mode,
        confidence: this.calculateConfidence(output, mode),
        durationMs,
      },
    };
  }

  private calculateConfidence(output: TOutput, mode: ProcessingMode): number {
    // Fallback sempre tem confiança baixa
    if (mode === 'fallback' || mode === 'rules') {
      return 0.3;
    }

    // Se output tem campo confidence, usar
    if (typeof output === 'object' && output !== null && 'confidence' in output) {
      return (output as any).confidence;
    }

    // Default para AI
    return 0.8;
  }

  // ========================================
  // OBSERVABILITY
  // ========================================

  getStatus(): {
    name: string;
    mode: ProcessingMode;
    uptime: number;
  } {
    return {
      name: this.config.name,
      mode: this.context.mode,
      uptime: Date.now() - this.context.startTime,
    };
  }
}

3. agents/intent.agent.ts - Exemplo de Agente Real

/**
 * Intent Analysis Agent
 * 
 * Responsável por classificar a intenção do lead.
 * Usa memória vetorial para contexto histórico.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { BaseAgent } from './base.agent';
import { primaryModel, fallbackModel } from '../models';
import { IntentLayerOutput, MemoryContext } from '../mcp/types';
import { getMemoryContext } from '../memory';
import { loadPrompt } from '../prompts';

// ========================================
// INPUT/OUTPUT
// ========================================

interface IntentInput {
  email: string;
  message?: string;
  firstName?: string;
  company?: string;
  position?: string;
  verified: boolean;
}

// ========================================
// SCHEMA
// ========================================

const intentSchema = z.object({
  intent: z.enum(['high', 'medium', 'low', 'spam']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  userReply: z.string().max(100),
});

// ========================================
// AGENT
// ========================================

export class IntentAgent extends BaseAgent<IntentInput, IntentLayerOutput> {
  constructor() {
    super({
      name: 'IntentAgent',
      requiresAI: true,
      fallbackEnabled: true,
      confidenceThreshold: 0.7,
    });
  }

  // ========================================
  // AI PROCESSING
  // ========================================

  protected async processWithAI(input: IntentInput): Promise<IntentLayerOutput> {
    // 1. Buscar contexto de memória
    const memoryContext = await this.getMemoryContext(input);

    // 2. Construir prompt com contexto
    const prompt = await this.buildPrompt(input, memoryContext);

    // 3. Tentar GPT-4o
    try {
      const result = await generateObject({
        model: primaryModel,
        schema: intentSchema,
        prompt,
      });

      return {
        ...result.object,
        similarLeads: memoryContext.similarLeads.map(l => l.id),
      };
    } catch (primaryError) {
      console.warn('⚠️ GPT-4o failed, trying Gemini...');

      // 4. Fallback para Gemini
      const result = await generateObject({
        model: fallbackModel,
        schema: intentSchema,
        prompt,
      });

      return {
        ...result.object,
        similarLeads: memoryContext.similarLeads.map(l => l.id),
      };
    }
  }

  // ========================================
  // FALLBACK (RULE-BASED)
  // ========================================

  protected async processWithFallback(input: IntentInput): Promise<IntentLayerOutput> {
    const message = input.message?.toLowerCase() || '';

    // Keywords de alta intenção
    const highIntentKeywords = [
      'preço', 'valor', 'comprar', 'agendar', 'demo',
      'price', 'buy', 'purchase', 'quote', 'custo',
    ];

    // Keywords de spam
    const spamKeywords = [
      'viagra', 'casino', 'lottery', 'prince', 'inheritance',
    ];

    let intent: IntentLayerOutput['intent'] = 'low';
    let reasoning = 'Rule-based classification (AI unavailable)';

    // 1. Check spam
    if (spamKeywords.some(kw => message.includes(kw)) || !input.message) {
      intent = 'spam';
      reasoning = 'Spam patterns detected';
    }
    // 2. Check high intent
    else if (
      highIntentKeywords.some(kw => message.includes(kw)) ||
      input.position?.toLowerCase().includes('ceo') ||
      input.position?.toLowerCase().includes('founder')
    ) {
      intent = 'high';
      reasoning = 'High-intent keywords or senior position detected';
    }
    // 3. Check verified
    else if (input.verified) {
      intent = 'medium';
      reasoning = 'Verified email with valid message';
    }

    return {
      intent,
      confidence: 0.3, // Sempre baixa confiança no fallback
      reasoning,
      userReply: this.getDefaultReply(intent),
    };
  }

  // ========================================
  // VALIDATION
  // ========================================

  protected validate(input: IntentInput): boolean {
    return !!(input.email && input.email.includes('@'));
  }

  // ========================================
  // HELPERS
  // ========================================

  private async getMemoryContext(input: IntentInput): Promise<MemoryContext> {
    try {
      return await getMemoryContext(input.email, input.message || '');
    } catch (error) {
      console.warn('⚠️ Memory unavailable, using empty context');
      return {
        leadId: '',
        embedding: [],
        similarLeads: [],
      };
    }
  }

  private async buildPrompt(input: IntentInput, memory: MemoryContext): Promise<string> {
    const template = await loadPrompt('intent-classification');
    
    // Contexto de leads similares
    const similarContext = memory.similarLeads.length > 0
      ? `\n\nSIMILAR PAST LEADS:\n${memory.similarLeads.map(l => 
          `- ${l.email} (${l.intent}, ${Math.round(l.similarity * 100)}% similar)`
        ).join('\n')}`
      : '';

    return template
      .replace('{{EMAIL}}', input.email)
      .replace('{{MESSAGE}}', input.message || 'No message provided')
      .replace('{{NAME}}', `${input.firstName || 'Unknown'} ${input.company || ''}`)
      .replace('{{POSITION}}', input.position || 'Unknown')
      .replace('{{VERIFIED}}', input.verified ? 'Yes' : 'No')
      .replace('{{SIMILAR_CONTEXT}}', similarContext);
  }

  private getDefaultReply(intent: IntentLayerOutput['intent']): string {
    const replies = {
      high: 'Sua ambição foi notada. Estamos observando.',
      medium: 'Registro recebido. O sistema avaliará sua elegibilidade.',
      low: 'Acesso registrado. Aguarde análise.',
      spam: 'Ruído detectado. Acesso negado.',
    };

    return replies[intent];
  }
}