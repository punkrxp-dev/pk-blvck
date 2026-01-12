# 🚀 PUNK BLVCK

**Versão 2.0.0 - Security Hardened** | **Arquitetura NEØ Protected**

Uma aplicação full-stack moderna com Express, React, TypeScript, PostgreSQL e segurança enterprise-grade.

## 🛡️ Segurança Implementada

- ✅ **Hash bcrypt** com 12 rounds de salt
- ✅ **Rate limiting** (100 req/15min + 5 auth/15min)
- ✅ **Helmet security headers** (CSP, HSTS, XSS)
- ✅ **Autenticação Passport.js** completa
- ✅ **Validação Zod** com sanitização
- ✅ **CORS configurado** para produção

## 🚀 Início Rápido

### 1. Setup Inicial
```bash
# Clone o repositório (se aplicável)
git clone <repository-url>
cd punk-blvck

# Setup completo para desenvolvimento
make setup-dev

# Ou para produção
make setup-production
```

### 2. Configuração do Banco
```bash
# Configure DATABASE_URL no arquivo .env
cp .env.example .env
# Edite .env com suas credenciais

# Aplica schema no banco
make db-push

# (Opcional) Abre interface visual do banco
make studio
```

### 3. Executar Aplicação
```bash
# Desenvolvimento completo (frontend + backend)
make dev

# Apenas backend
make server

# Apenas frontend
make client

# Produção
make build
make start
```

## 📋 Comandos Disponíveis

Execute `make help` para ver todos os comandos ou use os abaixo:

### Desenvolvimento
```bash
make dev          # Servidor completo em desenvolvimento
make server       # Apenas backend
make client       # Apenas frontend
make build        # Build para produção
make start        # Executar em produção

# Resolução de conflitos de porta
make check-port      # Verifica se porta 5000 está ocupada
make free-port       # Libera porta 5000 (seguro - apenas processos do projeto)
make free-port-force # Libera porta 5000 FORÇADAMENTE (cuidado!)
make dev-alt         # Servidor na porta 5001 (alternativa)
```

### Banco de Dados
```bash
make db-push      # Aplicar schema no banco
make db-studio    # Interface visual do banco
make backup       # Criar backup
make restore      # Restaurar backup (BACKUP=path/to/file.sql)
```

### Qualidade & Segurança
```bash
make check        # Verificar tipos TypeScript
make audit        # Auditoria de segurança npm
make test         # Executar testes (se configurados)
```

### Utilitários
```bash
make status       # Status do projeto
make info         # Informações detalhadas
make clean        # Limpar arquivos temporários
make logs         # Ver logs da aplicação
make docs         # Abrir documentação
```

## 🏗️ Arquitetura

```
PUNK BLVCK
├── client/          # Frontend React + Vite
├── server/          # Backend Express + TypeScript
│   ├── ai/          # 🤖 AI Infrastructure (GPT-4o + Gemini)
│   └── ...
├── shared/          # Schemas e tipos compartilhados
├── docs/            # Documentação e relatórios
└── Makefile         # Comandos de automação
```

### Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript, PostgreSQL, Drizzle ORM
- **AI/LLM**: Vercel AI SDK, LangChain, GPT-4o, Gemini 2.0 Flash
- **Segurança**: bcrypt, Helmet, Passport.js, Rate Limiting
- **Ferramentas**: ESLint, TypeScript, Makefile

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/punkblvck
SESSION_SECRET=your-super-secret-session-key-here
FRONTEND_URL=http://localhost:5000
```

### Geração de .env.example
```bash
make env-example
```

## 🚨 Segurança

A aplicação implementa múltiplas camadas de segurança:

- **Autenticação**: Passport.js com estratégia local
- **Autorização**: Middleware de proteção de rotas
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Headers**: CSP, HSTS, XSS protection via Helmet
- **Validação**: Sanitização de entrada com Zod
- **Logs**: Logging estruturado para auditoria

### Verificação de Segurança

```bash
make audit          # Auditoria npm
make security-fix   # Correções automáticas
```

## 📚 Documentação

- **[Relatório de Segurança](./docs/correcoes-criticas.md)**: Correções críticas aplicadas
- **[Relatório de Integração AI](./docs/ai-integration-report.md)**: Stack de IA configurada
- **[AI Module Guide](./server/ai/README.md)**: Como usar os modelos de IA
- **[Makefile](./Makefile)**: Todos os comandos disponíveis
- **[Arquitetura NEØ](./docs/)**: Detalhes da arquitetura protegida

```bash
make docs  # Abrir documentação
```

## 🤖 Configuração de IA

### Setup Inicial

```bash
# 1. Configure as API keys no .env
OPENAI_API_KEY=sk-proj-your-key-here
GOOGLE_API_KEY=your-google-key-here

# 2. Teste a configuração
tsx server/test-ai-config.ts
```

### Modelos Disponíveis

- **GPT-4o (OpenAI)**: Tarefas complexas, raciocínio avançado
- **Gemini 2.0 Flash (Google)**: Respostas rápidas, fallback

### Uso Básico

```typescript
import { generateText } from 'ai';
import { primaryModel } from './server/ai';

const result = await generateText({
  model: primaryModel,
  prompt: 'Sua pergunta aqui',
});
```

Ver [documentação completa](./server/ai/README.md) para mais exemplos.

## 🐳 Docker - Deploy Instantâneo

### Deploy Frontend em 30 segundos

```bash
# Deploy ultra-rápido (recomendado)
make deploy-frontend

# Ou passo a passo
make docker-build     # Build da imagem
make docker-run       # Executar container
```

### Gerenciamento

```bash
make docker-stop      # Parar container
make docker-logs      # Ver logs
make docker-clean     # Limpar containers
```

### Deploy na nuvem

```bash
make tunnel-localtunnel  # URL pública instantânea
make tunnel-ngrok        # Tunnel com ngrok (se instalado)
```

**Resultado:** Frontend acessível em `http://localhost:8080` ou URL pública!

## 🔍 Monitoramento

```bash
# Ver status em tempo real
make status

# Ver logs
make logs

# Parar todos os processos (emergência)
make emergency-stop
```

## 🐛 Troubleshooting

### Porta 5000 ocupada
```bash
# Verificar qual processo está usando a porta
make check-port

# Liberar apenas processos do projeto (recomendado)
make free-port

# Liberar TODOS os processos na porta (perigoso!)
make free-port-force

# Ou usar porta alternativa (mais seguro)
make dev-alt
```

### Problemas de banco de dados
```bash
# Verificar conexão
make db-studio

# Aplicar schema
make db-push

# Reset completo
make db-setup
```

### Build falhando
```bash
# Limpar cache
make clean

# Verificar tipos
make check

# Rebuild completo
make build
```

### Vulnerabilidades de segurança

```bash
# Auditoria de segurança
make security-audit

# Correções automáticas (seguras)
make security-fix

# Correções forçadas (cuidado!)
make security-force-fix
```

## 🤝 Contribuição

⚠️ **IMPORTANTE**: Esta estrutura é protegida por arquitetura NEØ. Consulte o responsável antes de qualquer modificação estrutural.

 #Desenvolvimento:

1. Faça checkout de uma branch: `git checkout -b feature/nome`
2. Execute verificações: `make deploy-check`
3. Commit suas mudanças: `git commit -m "feat: descrição"`
4. Push: `git push origin feature/nome`

### Padrões de Código

- TypeScript strict mode habilitado
- ESLint configurado (se disponível)
- Testes unitários recomendados
- Documentação obrigatória para novas funcionalidades

## 📄 Licença

MIT License - ver arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ e segurança em mente**

🔒 **Arquitetura NEØ Protected** | 🚀 **Performance Otimizada** | 🛡️ **Security First**