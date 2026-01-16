import {
    ProcessingMode,
    ModelName,
    ModelProvider,
    PipelineStage,
    ProcessingMetadata
} from '../mcp/types';

export interface AgentConfig {
    name: string;
    description: string;
    primaryProvider: ModelProvider;
    primaryModel: ModelName;
    fallbackProvider?: ModelProvider;
    fallbackModel?: ModelName;
}

export interface AgentResult<T> {
    data: T;
    metadata: ProcessingMetadata;
    stage: PipelineStage;
}

/**
 * BaseAgent: A fundação de todos os nós cognitivos.
 * Garante que nenhum agente rode sem rastreabilidade.
 */
export abstract class BaseAgent<TInput, TOutput> {
    protected config: AgentConfig;

    constructor(config: AgentConfig) {
        this.config = config;
    }

    /**
     * O método público que o Pipeline chama.
     * Envolve a lógica real em métricas e try/catch.
     */
    async execute(input: TInput, context?: any): Promise<AgentResult<TOutput>> {
        const startTimeMs = Date.now();
        let mode: ProcessingMode = 'llm';
        let activeModel = this.config.primaryModel;
        let activeProvider = this.config.primaryProvider;
        let fallbackUsed = false;

        try {
            // Tentativa Principal
            const result = await this.process(input, context);

            return this.buildResult(result, startTimeMs, mode, activeProvider, activeModel, fallbackUsed);

        } catch (error) {
            console.warn(`[${this.config.name}] Primary model failed:`, error);

            // Lógica de Fallback Automática
            if (this.config.fallbackModel && this.config.fallbackProvider) {
                try {
                    console.info(`[${this.config.name}] Attempting fallback to ${this.config.fallbackModel}`);
                    mode = 'fallback';
                    activeModel = this.config.fallbackModel;
                    activeProvider = this.config.fallbackProvider;
                    fallbackUsed = true;

                    const result = await this.processFallback(input, context);
                    return this.buildResult(result, startTimeMs, mode, activeProvider, activeModel, fallbackUsed);

                } catch (fallbackError) {
                    // Se o fallback falhar, tenta regras (se implementado)
                    try {
                        mode = 'rules';
                        activeModel = 'rule-based';
                        activeProvider = 'rules';
                        const result = await this.processRules(input);
                        return this.buildResult(result, startTimeMs, mode, activeProvider, activeModel, fallbackUsed);
                    } catch (ruleError) {
                        throw new Error(`Agent ${this.config.name} critical failure: All modes exhausted. Original: ${error instanceof Error ? error.message : 'Unknown'}`);
                    }
                }
            }

            throw error;
        }
    }

    // --- Métodos Abstratos (O que cada agente deve implementar) ---

    protected abstract process(input: TInput, context?: any): Promise<TOutput>;

    protected async processFallback(input: TInput, context?: any): Promise<TOutput> {
        throw new Error("Fallback not implemented for this agent");
    }

    protected async processRules(input: TInput): Promise<TOutput> {
        throw new Error("Rule-based processing not implemented for this agent");
    }

    // --- Helpers Privados ---

    private buildResult(
        data: TOutput,
        startTimeMs: number,
        mode: ProcessingMode,
        provider: ModelProvider,
        model: ModelName,
        fallback: boolean
    ): AgentResult<TOutput> {
        const endTimeMs = Date.now();
        const durationMs = endTimeMs - startTimeMs;

        const stage: PipelineStage = {
            name: this.config.name,
            startedAt: new Date(startTimeMs).toISOString(),
            completedAt: new Date(endTimeMs).toISOString(),
            durationMs: durationMs,
            status: 'completed'
        };

        const metadata: ProcessingMetadata = {
            processingMode: mode,
            modelProvider: provider,
            actualModel: model,
            fallbackUsed: fallback,
            requiresHumanReview: mode === 'rules',
            processingTimeMs: durationMs,
            timestamp: new Date(endTimeMs).toISOString(),
            layers: {} // Será populado pelo orquestrador
        };

        return { data, metadata, stage };
    }
}
