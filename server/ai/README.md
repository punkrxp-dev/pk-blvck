# AI Module

Esta pasta contém toda a infraestrutura de Inteligência Artificial do projeto.

## Estrutura

```
server/ai/
├── index.ts          # Exports centralizados
├── models.ts         # Configuração dos modelos de IA
└── README.md         # Esta documentação
```

## Modelos Disponíveis

### Primary Model: GPT-4o (OpenAI)
- **Uso:** Tarefas complexas, raciocínio avançado, geração de código
- **Variável:** `OPENAI_API_KEY`
- **Import:** `import { primaryModel } from './ai'`

### Fallback Model: Gemini 2.0 Flash (Google)
- **Uso:** Respostas rápidas, otimização de custo, fallback
- **Variável:** `GOOGLE_API_KEY`
- **Import:** `import { fallbackModel } from './ai'`

## Como Usar

### Exemplo Básico

```typescript
import { generateText } from 'ai';
import { primaryModel } from './ai';

const result = await generateText({
  model: primaryModel,
  prompt: 'Explique o que é TypeScript',
});

console.log(result.text);
```

### Seleção Automática de Modelo

```typescript
import { selectModel } from './ai';
import { generateText } from 'ai';

const model = selectModel(); // Seleciona automaticamente baseado nas chaves disponíveis

const result = await generateText({
  model,
  prompt: 'Sua pergunta aqui',
});
```

### Verificar Configuração

```typescript
import { checkAIConfig } from './ai';

const config = checkAIConfig();
console.log(config);
// { openai: true, google: true, hasAnyModel: true }
```

## Variáveis de Ambiente Necessárias

Adicione ao seu arquivo `.env`:

```bash
OPENAI_API_KEY=sk-proj-your-openai-key-here
GOOGLE_API_KEY=your-google-api-key-here
```

## Próximos Passos

Quando estiver pronto para criar rotas de IA:

1. Criar `server/ai/chains.ts` - LangChain chains
2. Criar `server/routes/chat.ts` - Endpoints de chat
3. Criar `client/src/hooks/useChat.ts` - React hooks para UI

## Recursos

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [LangChain Docs](https://js.langchain.com/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Google AI Studio](https://ai.google.dev/)
