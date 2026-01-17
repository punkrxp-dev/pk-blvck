<!-- README em /script -->

# Scripts - PUNK BLVCK

Scripts de build, seed e utilitários com validações de segurança e logging estruturado.

## Arquivos

-  **`build.ts`**: Build otimizado para produção - Fortificado ✅
-  **`seed-leads.ts`**: Seed de dados fictícios para testes - Fortificado ✅
-  **`precheck.ts`**: Utilitários de validação de pré-requisitos - Novo ✅

## Como Usar

### Build para Produção

```bash
# Build completo com validações
npx tsx script/build.ts

# Ou via Makefile
make build
```

### Seed de Dados de Teste

```bash
# Apenas em desenvolvimento/teste
npx tsx script/seed-leads.ts

# Ou via Makefile
make seed-leads
```

## Validações de Segurança

### Pré-execução (Precheck)

-  Node.js versão ≥18
-  Arquivos obrigatórios presentes
-  Variáveis de ambiente configuradas
-  Conexão banco (para scripts que precisam)
-  Ambiente seguro (seed só roda em dev/test)

### Durante Execução

-  Logging estruturado com NEØ standards
-  Tratamento de erros robusto
-  Handlers de sinais para shutdown graceful
-  Validação de dados de entrada
-  Métricas de performance coletadas

## Funcionalidades

### Build Script (build.ts)

-  Build duplo: Vite (client) + esbuild (server)
-  SEO automático: Sitemap atualizado diariamente
-  Bundling inteligente: Allowlist de dependências críticas
-  Performance tracking: Tempos de build detalhados
-  Clean automático: Diretório dist limpo antes do build

### Seed Script (seed-leads.ts)

-  Dados balanceados: 3 High + 3 Medium + 2 Low + 2 Spam
-  Validação rigorosa: Emails, distribuição, tipos
-  Avisos de segurança: Operação destrutiva destacada
-  Relatórios completos: Sucessos, erros, métricas
-  Upsert inteligente: Atualiza dados existentes

### Precheck Utilities (precheck.ts)

-  Validações modulares: Arquivos, env, Node.js, DB
-  Context-aware: Validações específicas por script
-  Relatórios detalhados: Erros e warnings categorizados
-  Reutilizável: Usado por múltiplos scripts

## Avisos de Segurança

### Ambiente de Execução

-  **Build**: Pode rodar em qualquer ambiente
-  **Seed**: SOMENTE em `development` ou `test`
-  **Precheck**: Sempre executado antes dos scripts principais

### Operações Destrutivas

-  **Seed**: Sobrescreve dados existentes sem backup
-  **Build**: Limpa diretório `dist` completamente
-  **Validações**: Bloqueiam execução se pré-requisitos falharem

## Métricas Coletadas

### Build Metrics

-  Tempo total de build
-  Tempo de build do client (Vite)
-  Tempo de build do server (esbuild)
-  Número de dependências bundled/externalized

### Seed Metrics

-  Tempo total de execução
-  Leads criados com sucesso
-  Leads com falha
-  Distribuição por intent (high/medium/low/spam)

## Troubleshooting

### Build Falhando

```bash
# Verificar pré-requisitos
npx tsx -e "import('./script/precheck.ts').then(m => m.validateForBuild().then(console.log))"

# Verificar arquivos
ls -la package.json vite.config.ts tsconfig.json client/index.html
```

### Seed Falhando

```bash
# Verificar ambiente
echo $NODE_ENV

# Verificar banco
echo $DATABASE_URL

# Testar conexão
npx tsx -e "import('./script/precheck.ts').then(m => m.validateForSeed().then(console.log))"
```

## Desenvolvimento

### Adicionando Novos Scripts

1.  Criar arquivo em `script/nome.ts`
2.  Importar `precheck.ts` para validações
3.  Usar `log()` do NEØ logger
4.  Adicionar handlers de sinais
5.  Testar thoroughly antes do commit

### Modificando Validações

-  Editar `precheck.ts` para validações compartilhadas
-  Adicionar validações específicas no script individual
-  Manter compatibilidade com scripts existentes

---

**Author:** MELLØ // NEØ DEV

**Arquitetura:** NEØ Protected

**Segurança:** Hardened

**Última atualização:** 2026-01-17
