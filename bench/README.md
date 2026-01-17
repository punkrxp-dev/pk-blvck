# Benchmark Neo vs Legacy

Este diretório contém ferramentas para benchmark comparativo entre as implementações Neo (MCP) e Legacy do sistema de processamento de leads.

## Estrutura

```
bench/
├── configs/
│   └── default.json          # Configurações padrão do benchmark
├── datasets/
│   ├── dataset.jsonl         # Dataset completo (40 casos)
│   └── test-5.jsonl          # Dataset reduzido para testes rápidos
├── results/                  # Diretório para salvar resultados
├── run-benchmark.ts          # Runner principal do benchmark
├── validate-dataset.ts       # Validador de datasets
└── README.md                 # Esta documentação
```

## Dataset

O dataset contém casos balanceados:

-  **10 casos HIGH**: Leads com forte sinal de compra (CEOs, CTOs, mensagens específicas)
-  **10 casos MEDIUM**: Leads com interesse moderado (emails verificados, mensagens válidas)
-  **10 casos LOW**: Leads casuais (navegadores, estudantes)
-  **10 casos SPAM**: Conteúdo suspeito (promoções, scams)

## Métricas Avaliadas

### Qualidade

-  **Accuracy**: Taxa de acertos geral
-  **Macro F1**: Média F1 por classe (high/medium/low/spam)
-  **Taxa requiresHumanReview**: Leads que precisam revisão manual
-  **Taxa spam false positive**: Spam incorretamente classificado

### Operação

-  **Latência P50/P95/P99**: Percentis de latência total
-  **Latência por camada**: Breakdown por entry/presence/intent
-  **Distribuição processingMode**: % llm | fallback | rules

### Negócio

-  **Conversão por faixa**: Taxa de sucesso por intenção (high/medium/low)
-  **Tempo até ação**: Latência para email/notify

## Validação de Datasets

Antes de executar benchmarks, valide seus datasets:

```bash
# Validar dataset completo
npx tsx bench/validate-dataset.ts datasets/dataset.jsonl

# Validar dataset de teste
npx tsx bench/validate-dataset.ts datasets/test-5.jsonl
```

### Métricas de Validação

- **Distribuição balanceada**: 10 casos por categoria (high/medium/low/spam)
- **Campos obrigatórios**: email, source, expected_intent
- **Formato de email**: Validação básica de formato
- **JSON válido**: Cada linha deve ser JSON válido

## Como Executar

### Pré-requisitos

1.  Servidor rodando com endpoint `/api/mcp/ingest` na porta 5000
2.  Chaves de API configuradas (OpenAI, Google AI)
3.  Banco de dados configurado

### Benchmark Neo (MCP Pipeline)

```bash
BENCH_MODE=neo npx tsx bench/run-benchmark.ts
```

### Benchmark Legacy

```bash
BENCH_MODE=legacy npx tsx bench/run-benchmark.ts
```

### Configuração Personalizada

```bash
# Porta customizada
BENCH_API=http://localhost:3000/api/mcp/ingest BENCH_MODE=neo npx tsx bench/run-benchmark.ts

# Dataset customizado
BENCH_DATASET=/path/to/custom/dataset.jsonl BENCH_MODE=neo npx tsx bench/run-benchmark.ts
```

## Formato de Saída

```json
{
  "mode": "neo",
  "n": 40,
  "accuracy": 0.85,
  "macroF1": 0.83,
  "latencyMs": {
    "p50": 1250,
    "p95": 2100,
    "p99": 3500
  },
  "processingModeDist": {
    "llm": 35,
    "fallback": 4,
    "rules": 1
  },
  "samples": [...]
}
```

## Implementação Técnica

### Switch Mode

O endpoint `/api/mcp/ingest` aceita parâmetro `?mode=neo|legacy`:

-  `neo`: Usa MCP Pipeline (Sentinel → Observer → Intent agents)
-  `legacy`: Usa pipeline legado com fallback direto

### Parsing de Resposta

O runner adapta diferentes formatos de resposta:

-  Neo: `json.intent.intent`
-  Legacy: `json.classification.intent`

## Troubleshooting

### Servidor não responde

```bash
# Verificar se servidor está rodando
curl http://localhost:5000/api/mcp/health

# Verificar logs do servidor
npm run dev
```

### Erro de API

```bash
# Verificar variáveis de ambiente
cat .env
# OPENAI_API_KEY=...
# GOOGLE_AI_API_KEY=...
```

### Timeout

```bash
# Benchmark com timeout customizado (implementar se necessário)
timeout 300s npx tsx bench/run-benchmark.ts
```
