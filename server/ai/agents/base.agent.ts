
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
import { log } from '../../utils/logger';

// Type-safe confidence extraction helper
function extractConfidence(obj: unknown): number | null {
    if (!obj || typeof obj !== 'object') {
        return null;
    }

    const record = obj as Record<string, unknown>;
    const confidence = record.confidence;

    return typeof confidence === 'number' ? confidence : null;
}

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
                    log(`AI failed in ${this.config.name}, using fallback`, this.config.name, 'warn');

                    if (!this.config.fallbackEnabled) {
                        throw aiError;
                    }
                }
            }

            // 3. Fallback
            const output = await this.processWithFallback(input);
            return this.buildResponse(output, 'fallback', startTime);

        } catch (error) {
            log(
                `${this.config.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                this.config.name,
                'error'
            );
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
                modelProvider: 'openai', // Default, should be dynamic in improved version
                modelName: 'gpt-4o', // Default
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

        // Type-safe confidence extraction
        const confidence = extractConfidence(output);
        return confidence ?? 0.8;
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
