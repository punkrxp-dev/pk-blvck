<!-- README em /tests -->

# 🧪 Testes — PUNK BLVCK

Pasta dedicada para testes automatizados do sistema.

---

## 📁 Estrutura

```text
tests/
├── setup.ts              # Configuração global de testes
├── unit/                 # Testes unitários
│   ├── agents.test.ts    # Testes dos agentes IA
│   ├── circuit-breaker.test.ts  # Testes do Circuit Breaker
│   └── validation.test.ts       # Testes de validação e segurança
└── README.md             # Este arquivo
```

---

## 🚀 Executando Testes

### Todos os testes

```bash
npm test
```

### Testes específicos

```bash
# Validação e segurança
npm run test:validation

# Circuit Breaker
npm run test:circuit-breaker

# Agentes IA
npm run test:agents
```

---

## 🎯 Cobertura

### Testes Unitários (`unit/`)

| Arquivo | Cobertura | Descrição |
|---------|-----------|-----------|
| `validation.test.ts` | Segurança | Email, XSS, SQL Injection, Spam |
| `circuit-breaker.test.ts` | Resiliência | Estados, Retry, Rate Limit |
| `agents.test.ts` | IA | Sentinel, Observer, Intent |

---

## 🔒 Testes de Segurança

### Validação de Email

- ✅ Emails válidos
- ✅ Detecção de domínios temporários
- ✅ Padrões suspeitos (números excessivos, dots)
- ✅ Formato inválido

### Proteção de Conteúdo

- ✅ XSS (script tags)
- ✅ SQL Injection
- ✅ Spam keywords
- ✅ Repetição de caracteres

### Sanitização de Dados

- ✅ Nomes com caracteres especiais
- ✅ Telefones
- ✅ URLs LinkedIn

---

## ⚡ Circuit Breaker

### Estados testados

- `CLOSED` → Normal operation
- `OPEN` → Service unavailable
- `HALF_OPEN` → Testing recovery

### Comportamentos

- ✅ Threshold de falhas
- ✅ Timeout de recuperação
- ✅ Retry com backoff exponencial
- ✅ Rate limit handling

---

## 🤖 Agentes IA

### Sentinel Agent

- ✅ Detecção de spam
- ✅ Validação de entrada
- ✅ Bloqueio de domínios suspeitos

### Observer Agent

- ✅ Enriquecimento de dados
- ✅ Fallback para dados parciais
- ✅ Detecção de emails temporários

### Intent Agent

- ✅ Classificação de intenção
- ✅ Fallback entre modelos
- ✅ Validação de mensagem

---

## 📝 Convenções

### Nomenclatura

- Arquivos: `*.test.ts`
- Suites: `describe('ComponentName', () => { ... })`
- Casos: `it('should do X when Y', () => { ... })`

### Estrutura de teste

```typescript
describe('Feature', () => {
  describe('method', () => {
    it('should behave correctly', () => {
      // Arrange
      const input = { ... };

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

---

## 🔧 Configuração

### Setup (`setup.ts`)

- Carrega variáveis de ambiente de teste
- Define `NODE_ENV=test`
- Configura mocks globais

### Variáveis de ambiente

Crie `.env.test` para testes:

```env
NODE_ENV=test
SESSION_SECRET=test-secret-key
```

---

## 📊 Comandos npm

| Comando | Descrição |
|---------|-----------|
| `npm test` | Executa todos os testes |
| `npm run test:validation` | Testes de validação |
| `npm run test:circuit-breaker` | Testes de resiliência |
| `npm run test:agents` | Testes de agentes IA |

---

## ⚠️ Notas

- Testes usam Node.js native test runner (`node --test`)
- Compatível com ES Modules
- Não requer Jest em produção

---

**Author:** NEØ Protocol  
**Last Updated:** 2026-01-17
