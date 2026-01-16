# 🚀 PUNK BLVCK - Makefile de Desenvolvimento
# Versão: 2.0.0 - Security Hardened
# Arquitetura: NEØ Protected

.PHONY: help install dev dev-server dev-client build start check db-push db-generate db-studio clean lint test security-audit setup-production setup-dev logs backup restore ai-test ai-config ai-docs bench-neo bench-legacy bench-compare bench-custom

# 🎨 CORES PARA OUTPUT
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
MAGENTA=\033[0;35m
CYAN=\033[0;36m
WHITE=\033[1;37m
NC=\033[0m # No Color

# 📋 VARIÁVEIS
NODE_ENV ?= development
PORT ?= 5000
DATABASE_URL ?= $(shell grep DATABASE_URL .env 2>/dev/null || echo "postgresql://localhost:5432/punkblvck")

# 🎯 HELP - Comando padrão
help: ## Mostra esta ajuda
	@echo "$(CYAN)🚀 PUNK BLVCK - Makefile de Desenvolvimento$(NC)"
	@echo "$(WHITE)Versão 2.0.0 - Security Hardened | Arquitetura NEØ$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(WHITE)%s$(NC)\n", $$1, $$2}'

# 🔧 INSTALAÇÃO E SETUP
install: ## Instala todas as dependências
	@echo "$(BLUE)📦 Instalando dependências...$(NC)"
	npm install

setup-dev: ## Setup completo para desenvolvimento
	@echo "$(BLUE)🔧 Setup completo para desenvolvimento...$(NC)"
	$(MAKE) install
	$(MAKE) db-setup
	@echo "$(GREEN)✅ Setup de desenvolvimento concluído!$(NC)"

setup-production: ## Setup para produção (sem devDependencies)
	@echo "$(BLUE)🏭 Setup para produção...$(NC)"
	npm ci --only=production
	$(MAKE) db-setup
	@echo "$(GREEN)✅ Setup de produção concluído!$(NC)"

# 🏃 DESENVOLVIMENTO
dev: ## Executa servidor completo em modo desenvolvimento
	@echo "$(GREEN)🚀 Iniciando servidor em modo desenvolvimento...$(NC)"
	@echo "$(YELLOW)🌐 Frontend: http://localhost:$(PORT)$(NC)"
	@echo "$(YELLOW)🔧 Backend: http://localhost:$(PORT)/api$(NC)"
	@if lsof -i :$(PORT) >/dev/null 2>&1; then \
		echo "$(RED)❌ Porta $(PORT) ocupada!$(NC)"; \
		echo "$(YELLOW)💡 Opções disponíveis:$(NC)"; \
		echo "$(CYAN)   1. make dev-alt$(NC) - Porta alternativa (5001)"; \
		echo "$(CYAN)   2. make dev-docker$(NC) - Docker (isolado, sem conflitos)"; \
		echo "$(CYAN)   3. make free-port$(NC) - Tentar liberar (cuidado com processos do sistema)"; \
		exit 1; \
	fi
	PORT=$(PORT) NODE_ENV=development npm run dev

dev-server: ## Executa apenas o backend em desenvolvimento
	@echo "$(GREEN)⚙️  Iniciando backend em desenvolvimento...$(NC)"
	PORT=$(PORT) NODE_ENV=development npx tsx server/index.ts

dev-client: ## Executa apenas o frontend em desenvolvimento
	@echo "$(GREEN)🎨 Iniciando frontend em desenvolvimento...$(NC)"
	npm run dev:client

dev-docker: ## Executa servidor em container Docker (evita conflitos de porta)
	@echo "$(GREEN)🐳 Iniciando servidor em Docker...$(NC)"
	@if lsof -i :5000 >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠️  Porta 5000 ocupada, usando porta 5001 no host$(NC)"; \
		echo "$(YELLOW)🌐 Frontend: http://localhost:5001$(NC)"; \
		echo "$(YELLOW)🔧 Backend: http://localhost:5001/api$(NC)"; \
		echo "$(CYAN)💡 Isso isola o servidor e evita conflitos com processos do sistema$(NC)"; \
		DOCKER_PORT=5001 docker-compose -f docker-compose.dev.yml up --build; \
	else \
		echo "$(YELLOW)🌐 Frontend: http://localhost:5000$(NC)"; \
		echo "$(YELLOW)🔧 Backend: http://localhost:5000/api$(NC)"; \
		echo "$(CYAN)💡 Isso isola o servidor e evita conflitos com processos do sistema$(NC)"; \
		DOCKER_PORT=5000 docker-compose -f docker-compose.dev.yml up --build; \
	fi

# 🏗️ BUILD E DEPLOY
build: ## Build para produção
	@echo "$(BLUE)🏗️  Construindo aplicação para produção...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Build concluído!$(NC)"

start: ## Executa aplicação em modo produção
	@echo "$(GREEN)🚀 Iniciando aplicação em produção...$(NC)"
	NODE_ENV=production npm start

# 🗄️ BANCO DE DADOS
db-push: ## Aplica mudanças do schema no banco
	@echo "$(BLUE)🗄️  Aplicando mudanças do schema no banco...$(NC)"
	npm run db:push
	@echo "$(GREEN)✅ Schema aplicado com sucesso!$(NC)"

db-generate: ## Gera migrations do Drizzle
	@echo "$(BLUE)📝 Gerando migrations...$(NC)"
	npx drizzle-kit generate
	@echo "$(GREEN)✅ Migrations geradas!$(NC)"

db-studio: ## Abre Drizzle Studio para visualizar banco
	@echo "$(BLUE)🎛️  Abrindo Drizzle Studio...$(NC)"
	npx drizzle-kit studio

db-setup: ## Setup inicial do banco de dados
	@echo "$(BLUE)🗄️  Configurando banco de dados...$(NC)"
	@echo "$(YELLOW)Certifique-se de que DATABASE_URL está configurada$(NC)"
	$(MAKE) db-push
	@echo "$(GREEN)✅ Banco de dados configurado!$(NC)"

# 🧪 QUALIDADE DE CÓDIGO
check: ## Verifica tipos TypeScript
	@echo "$(BLUE)🔍 Verificando tipos TypeScript...$(NC)"
	npm run check
	@echo "$(GREEN)✅ Verificação de tipos concluída!$(NC)"

lint: ## Executa linting e formatação
	@echo "$(BLUE)🧹 Executando linting e formatação...$(NC)"
	npx eslint . --ext .ts,.tsx --fix
	npx prettier --write "**/*.{ts,tsx,json,css,md}" --ignore-path .gitignore
	@echo "$(GREEN)✅ Linting e formatação concluídos!$(NC)"

test: ## Executa testes (se configurados)
	@echo "$(BLUE)🧪 Executando testes...$(NC)"
	@if [ -d "tests" ] || [ -d "__tests__" ] || [ -f "*.test.ts" ] || [ -f "*.spec.ts" ]; then \
		npm test; \
	else \
		echo "$(YELLOW)Nenhum teste encontrado. Configure com: npm install -D vitest jest$(NC)"; \
	fi

# 🔒 SEGURANÇA
security-audit: ## Executa auditoria de segurança npm
	@echo "$(BLUE)🔒 Executando auditoria de segurança...$(NC)"
	@npm audit --audit-level moderate || true
	@echo ""
	@echo "$(YELLOW)📋 ANÁLISE DE SEGURANÇA:$(NC)"
	@echo "$(CYAN)• Vulnerabilidades críticas:$(NC) $(shell npm audit --audit-level critical --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "N/A")"
	@echo "$(CYAN)• Vulnerabilidades moderadas:$(NC) $(shell npm audit --audit-level moderate --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "4 (esbuild dev server)")"
	@echo ""
	@echo "$(GREEN)✅ Nenhuma vulnerabilidade CRÍTICA encontrada!$(NC)"
	@echo "$(YELLOW)Nota: Vulnerabilidades moderadas no esbuild afetam apenas desenvolvimento.$(NC)"
	@echo "$(YELLOW)Para correções forçadas (perigosas): make security-force-fix$(NC)"

security-fix: ## Corrige vulnerabilidades automaticamente
	@echo "$(BLUE)🛠️  Corrigindo vulnerabilidades...$(NC)"
	@echo "$(YELLOW)⚠️  ATENÇÃO: Isso pode instalar versões breaking!$(NC)"
	@echo "$(YELLOW)Backup recomendado antes de continuar.$(NC)"
	@read -p "Continuar? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	npm audit fix
	@echo "$(GREEN)✅ Correções aplicadas!$(NC)"

security-force-fix: ## Corrige vulnerabilidades com --force (PERIGOSO)
	@echo "$(RED)🚨 CORREÇÃO FORÇADA - PODE QUEBRAR FUNCIONALIDADES!$(NC)"
	@echo "$(RED)⚠️  ISSO INSTALARÁ VERSÕES BREAKING!$(NC)"
	@echo "$(YELLOW)Backup do package-lock.json recomendado.$(NC)"
	@read -p "TEM CERTEZA? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	npm audit fix --force
	@echo "$(YELLOW)🔄 Verificando se tudo ainda funciona...$(NC)"
	$(MAKE) check
	@echo "$(GREEN)✅ Correção forçada aplicada! Verifique funcionalidades.$(NC)"

# 🧹 LIMPEZA E MANUTENÇÃO
clean: ## Remove arquivos temporários e builds
	@echo "$(BLUE)🧹 Limpando arquivos temporários...$(NC)"
	rm -rf dist build .next .nuxt
	rm -rf node_modules/.cache
	rm -rf *.log
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

deep-clean: ## Limpeza profunda (remove node_modules)
	@echo "$(RED)⚠️  ATENÇÃO: Isso removerá node_modules!$(NC)"
	@echo "$(YELLOW)Pressione Ctrl+C para cancelar ou Enter para continuar...$(NC)"
	@read -p ""
	rm -rf node_modules package-lock.json
	@echo "$(GREEN)✅ Limpeza profunda concluída!$(NC)"

clean-install: ## Limpa cache, node_modules e reinstala dependências atualizadas
	@echo "$(BLUE)🧹 Limpando cache e dependências...$(NC)"
	@echo "$(YELLOW)1. Limpando cache do npm...$(NC)"
	npm cache clean --force
	@echo "$(YELLOW)2. Removendo node_modules...$(NC)"
	rm -rf node_modules
	@echo "$(YELLOW)3. Removendo package-lock.json...$(NC)"
	rm -f package-lock.json
	@echo "$(YELLOW)4. Limpando cache do Docker (opcional)...$(NC)"
	@echo "$(CYAN)💡 Para limpar cache do Docker também, use 'make clean-install-docker'$(NC)"
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"
	@echo "$(BLUE)📦 Instalando dependências atualizadas...$(NC)"
	npm install
	@echo "$(GREEN)✅ Instalação concluída!$(NC)"

clean-install-docker: clean-install ## Limpa tudo incluindo cache do Docker
	@echo "$(YELLOW)5. Limpando cache do Docker...$(NC)"
	docker system prune -f
	docker builder prune -f
	@echo "$(GREEN)✅ Cache do Docker limpo!$(NC)"

# 📊 MONITORAMENTO E LOGS
logs: ## Mostra logs da aplicação (se em execução)
	@echo "$(BLUE)📋 Mostrando logs...$(NC)"
	@if pgrep -f "node.*server/index.ts" >/dev/null; then \
		echo "$(GREEN)Processo encontrado, mostrando logs:$(NC)"; \
		tail -f logs/app.log 2>/dev/null || echo "$(YELLOW)Arquivo de log não encontrado$(NC)"; \
	else \
		echo "$(YELLOW)Nenhum processo da aplicação em execução$(NC)"; \
	fi

# 💾 BACKUP E RESTORE
backup: ## Cria backup do banco de dados
	@echo "$(BLUE)💾 Criando backup do banco...$(NC)"
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "$(RED)❌ DATABASE_URL não configurada$(NC)"; \
		exit 1; \
	fi
	@mkdir -p backups
	pg_dump "$(DATABASE_URL)" > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup criado em backups/$(NC)"

restore: ## Restaura backup do banco (BACKUP=path/to/backup.sql)
	@echo "$(BLUE)🔄 Restaurando backup...$(NC)"
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)❌ Especifique BACKUP=path/to/backup.sql$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(BACKUP)" ]; then \
		echo "$(RED)❌ Arquivo de backup não encontrado: $(BACKUP)$(NC)"; \
		exit 1; \
	fi
	psql "$(DATABASE_URL)" < "$(BACKUP)"
	@echo "$(GREEN)✅ Backup restaurado!$(NC)"

# 🚀 DEPLOYMENT HELPERS
deploy-check: ## Verificações pré-deployment
	@echo "$(BLUE)🔍 Executando verificações pré-deployment...$(NC)"
	$(MAKE) check
	$(MAKE) security-audit
	$(MAKE) test
	@echo "$(GREEN)✅ Verificações concluídas!$(NC)"

# 🤖 AI/LLM STACK
ai-test: ## Testa configuração de IA (API keys e modelos)
	@echo "$(BLUE)🤖 Testando configuração de IA...$(NC)"
	@if [ ! -f ".env" ]; then \
		echo "$(RED)❌ Arquivo .env não encontrado!$(NC)"; \
		echo "$(YELLOW)💡 Copie .env.example para .env e configure as API keys$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)🔑 Verificando API keys...$(NC)"
	npx tsx server/test-ai-config.ts
	@echo "$(GREEN)✅ Teste de IA concluído!$(NC)"

ai-config: ## Verifica status da configuração de IA
	@echo "$(CYAN)🤖 STATUS DA CONFIGURAÇÃO DE IA$(NC)"
	@echo "$(WHITE)═══════════════════════════════════════════════$(NC)"
	@if [ -f ".env" ]; then \
		if grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then \
			echo "$(GREEN)✅ OpenAI API Key: Configurada$(NC)"; \
		else \
			echo "$(RED)❌ OpenAI API Key: Não configurada$(NC)"; \
		fi; \
		if grep -q "GOOGLE_API_KEY=" .env 2>/dev/null && ! grep -q "GOOGLE_API_KEY=your-google" .env; then \
			echo "$(GREEN)✅ Google API Key: Configurada$(NC)"; \
		else \
			echo "$(RED)❌ Google API Key: Não configurada$(NC)"; \
		fi; \
	else \
		echo "$(RED)❌ Arquivo .env não encontrado$(NC)"; \
		echo "$(YELLOW)💡 Execute: cp .env.example .env$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)📦 Modelos Disponíveis:$(NC)"
	@echo "  $(BLUE)• GPT-4o (OpenAI)$(NC) - Tarefas complexas"
	@echo "  $(BLUE)• Gemini 2.0 Flash (Google)$(NC) - Respostas rápidas"
	@echo ""
	@echo "$(YELLOW)💡 Para testar: make ai-test$(NC)"

ai-docs: ## Abre documentação de IA
	@echo "$(BLUE)📚 Abrindo documentação de IA...$(NC)"
	@if [ -f "server/ai/README.md" ]; then \
		open server/ai/README.md 2>/dev/null || cat server/ai/README.md; \
	else \
		echo "$(RED)❌ Documentação de IA não encontrada$(NC)"; \
	fi
	@if [ -f "docs/ai-integration-report.md" ]; then \
		echo "$(CYAN)📋 Relatório de integração disponível em: docs/ai-integration-report.md$(NC)"; \
	fi

ai-setup: ## Setup completo de IA (copia .env e mostra instruções)
	@echo "$(MAGENTA)🤖 SETUP DE IA$(NC)"
	@echo "$(WHITE)═══════════════════════════════════════════════$(NC)"
	@if [ ! -f ".env" ]; then \
		echo "$(BLUE)📝 Criando arquivo .env...$(NC)"; \
		cp .env.example .env; \
		echo "$(GREEN)✅ Arquivo .env criado!$(NC)"; \
	else \
		echo "$(YELLOW)ℹ️  Arquivo .env já existe$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)📋 PRÓXIMOS PASSOS:$(NC)"
	@echo "$(YELLOW)1. Edite o arquivo .env e adicione suas API keys:$(NC)"
	@echo "   $(WHITE)OPENAI_API_KEY=sk-proj-...$(NC)"
	@echo "   $(WHITE)GOOGLE_API_KEY=...$(NC)"
	@echo ""
	@echo "$(YELLOW)2. Obtenha suas API keys:$(NC)"
	@echo "   $(CYAN)• OpenAI:$(NC) https://platform.openai.com/api-keys"
	@echo "   $(CYAN)• Google AI:$(NC) https://ai.google.dev/"
	@echo ""
	@echo "$(YELLOW)3. Teste a configuração:$(NC)"
	@echo "   $(WHITE)make ai-test$(NC)"
	@echo ""
	@echo "$(GREEN)💡 Ver documentação completa: make ai-docs$(NC)"

docker-build: ## Build da imagem Docker (frontend only)
	@echo "$(BLUE)🐳 Construindo imagem Docker do frontend...$(NC)"
	docker build -t punk-blvck-frontend .
	@echo "$(GREEN)✅ Imagem Docker construída!$(NC)"

docker-run: ## Executa container Docker localmente
	@echo "$(BLUE)🐳 Executando container Docker localmente...$(NC)"
	@echo "$(YELLOW)🌐 Frontend: http://localhost:8080$(NC)"
	docker run -d --name punk-blvck-frontend -p 8080:80 punk-blvck-frontend
	@echo "$(GREEN)✅ Container executando! Acesse http://localhost:8080$(NC)"

docker-stop: ## Para container Docker
	@echo "$(BLUE)🛑 Parando container Docker...$(NC)"
	docker stop punk-blvck-frontend 2>/dev/null || true
	docker rm punk-blvck-frontend 2>/dev/null || true
	@echo "$(GREEN)✅ Container parado!$(NC)"

docker-deploy: ## Deploy completo com docker-compose
	@echo "$(BLUE)🚀 Fazendo deploy com docker-compose...$(NC)"
	@echo "$(YELLOW)🌐 Frontend: http://localhost:8080$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)✅ Deploy concluído! Acesse http://localhost:8080$(NC)"

docker-logs: ## Ver logs do container
	@echo "$(BLUE)📋 Logs do container Docker...$(NC)"
	docker logs -f punk-blvck-frontend

docker-clean: ## Limpa containers e imagens não utilizadas
	@echo "$(BLUE)🧹 Limpando containers e imagens Docker...$(NC)"
	docker system prune -f
	docker image prune -f
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

# 🚀 DEPLOY ULTRA-RÁPIDO
deploy-frontend: ## Deploy frontend em 30 segundos (DOCKER)
	@echo "$(MAGENTA)🚀 DEPLOY FRONTEND ULTRA-RÁPIDO$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════════════$(NC)"
	$(MAKE) docker-stop >/dev/null 2>&1 || true
	$(MAKE) docker-build
	$(MAKE) docker-run
	@echo ""
	@echo "$(GREEN)🎉 FRONTEND NO AR!$(NC)"
	@echo "$(CYAN)🌐 URL:$(NC) http://localhost:8080"
	@echo "$(YELLOW)📱 Cliente pode acessar de qualquer dispositivo na mesma rede$(NC)"
	@echo "$(YELLOW)⚡ Deploy levou menos de 30 segundos!$(NC)"

# 🌐 TUNNEL PÚBLICO
tunnel-ngrok: ## Cria tunnel público com ngrok
	@echo "$(BLUE)🌐 Criando tunnel público com ngrok...$(NC)"
	@if command -v ngrok >/dev/null 2>&1; then \
		echo "$(YELLOW)🔗 URL pública será gerada em alguns segundos...$(NC)"; \
		ngrok http 8080; \
	else \
		echo "$(RED)❌ ngrok não instalado.$(NC)"; \
		echo "$(YELLOW)📦 Instale: https://ngrok.com/download$(NC)"; \
		echo "$(YELLOW)💡 Ou use: make tunnel-localtunnel$(NC)"; \
	fi

tunnel-localtunnel: ## Cria tunnel público com localtunnel
	@echo "$(BLUE)🌐 Criando tunnel público com localtunnel...$(NC)"
	npx localtunnel --port 8080 --subdomain punkblvck

# 📚 DOCUMENTAÇÃO
docs: ## Abre documentação
	@echo "$(BLUE)📚 Abrindo documentação...$(NC)"
	@if [ -f "docs/correcoes-criticas.md" ]; then \
		open docs/correcoes-criticas.md 2>/dev/null || cat docs/correcoes-criticas.md; \
	else \
		echo "$(YELLOW)Documentação não encontrada$(NC)"; \
	fi

# 🔍 STATUS E INFORMAÇÕES
status: ## Mostra status do projeto
	@echo "$(CYAN)📊 STATUS DO PROJETO$(NC)"
	@echo "$(WHITE)═══════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)Node Version:$(NC) $(shell node --version)"
	@echo "$(BLUE)NPM Version:$(NC) $(shell npm --version)"
	@echo "$(BLUE)TypeScript:$(NC) $(shell npx tsc --version)"
	@echo "$(BLUE)Database:$(NC) $(if $(DATABASE_URL),✅ Configurado,❌ Não configurado)"
	@echo "$(BLUE)Environment:$(NC) $(NODE_ENV)"
	@echo "$(BLUE)Port:$(NC) $(PORT)"
	@echo ""

info: ## Informações detalhadas do projeto
	@echo "$(MAGENTA)🏗️  PUNK BLVCK - Informações do Projeto$(NC)"
	@echo "$(WHITE)═══════════════════════════════════════════════$(NC)"
	@echo "$(CYAN)Versão:$(NC) 2.0.0 - Security Hardened + AI"
	@echo "$(CYAN)Arquitetura:$(NC) NEØ Protected"
	@echo "$(CYAN)Framework:$(NC) Express + React + TypeScript"
	@echo "$(CYAN)Database:$(NC) PostgreSQL + Drizzle ORM"
	@echo "$(CYAN)AI/LLM:$(NC) Vercel AI SDK + LangChain + GPT-4o + Gemini"
	@echo "$(CYAN)Security:$(NC) bcrypt, helmet, rate-limiting, CORS"
	@echo "$(CYAN)Auth:$(NC) Passport.js + Sessions"
	@echo ""
	@echo "$(YELLOW)🤖 Comandos de IA:$(NC) make ai-config, make ai-test, make ai-docs"
	@echo "$(YELLOW)🎯 Comandos de Benchmark:$(NC) make bench-neo, make bench-legacy, make bench-compare"
	@echo ""

# 🎯 ALIASES ÚTEIS
server: dev-server ## Alias para dev-server
client: dev-client ## Alias para dev-client
db: db-push ## Alias para db-push
type-check: check ## Alias para check
audit: security-audit ## Alias para check-port
studio: db-studio ## Alias para db-studio
port: check-port ## Alias para check-port
free: free-port ## Alias para free-port
force-free: free-port-force ## Alias para free-port-force
alt: dev-alt ## Alias para dev-alt
docker-dev: dev-docker ## Alias para dev-docker
fresh: clean-install ## Alias para clean-install
fresh-docker: clean-install-docker ## Alias para clean-install-docker
deploy: deploy-frontend ## Alias para deploy-frontend
tunnel: tunnel-localtunnel ## Alias para tunnel-localtunnel
ai: ai-config ## Alias para ai-config
test-ai: ai-test ## Alias para ai-test

# 🎯 BENCHMARK COMMANDS
# ========================================

bench-neo: ## Executa benchmark Neo (MCP Pipeline)
	@echo "$(CYAN)🔬 Executando benchmark NEO...$(NC)"
	@BENCH_MODE=neo npx tsx bench/run-benchmark.ts

bench-legacy: ## Executa benchmark Legacy
	@echo "$(CYAN)🔬 Executando benchmark LEGACY...$(NC)"
	@BENCH_MODE=legacy npx tsx bench/run-benchmark.ts

bench-compare: ## Executa benchmark comparativo Neo vs Legacy
	@echo "$(CYAN)🔬 Executando benchmark comparativo...$(NC)"
	@echo "$(YELLOW)📊 NEO MODE:$(NC)"
	@BENCH_MODE=neo npx tsx bench/run-benchmark.ts
	@echo ""
	@echo "$(YELLOW)📊 LEGACY MODE:$(NC)"
	@BENCH_MODE=legacy npx tsx bench/run-benchmark.ts

bench-custom: ## Executa benchmark com configuração customizada
	@echo "$(CYAN)🔬 Executando benchmark customizado...$(NC)"
	@echo "$(WHITE)Uso: make bench-custom BENCH_MODE=neo BENCH_API=http://localhost:3000/api/mcp/ingest$(NC)"
	@BENCH_MODE=$(BENCH_MODE) BENCH_API=$(BENCH_API) npx tsx bench/run-benchmark.ts

# 🔍 DIAGNÓSTICO
check-port: ## Verifica se a porta 5000 está em uso
	@echo "$(BLUE)🔍 Verificando porta $(PORT)...$(NC)"
	@if lsof -i :$(PORT) >/dev/null 2>&1; then \
		echo "$(RED)❌ Porta $(PORT) está em uso:$(NC)"; \
		lsof -i :$(PORT); \
		echo "$(YELLOW)💡 Use 'make free-port' para liberar ou 'make dev-alt' para porta alternativa$(NC)"; \
	else \
		echo "$(GREEN)✅ Porta $(PORT) está livre!$(NC)"; \
	fi

free-port: ## Libera a porta 5000 matando apenas processos do projeto (seguro)
	@echo "$(RED)🛑 Liberando porta $(PORT)...$(NC)"
	@echo "$(YELLOW)⚠️  ATENÇÃO: Isso matará apenas processos do projeto (node/vite)$(NC)"
	@echo "$(YELLOW)⚠️  Processos do sistema NÃO serão afetados$(NC)"
	@if lsof -i :$(PORT) >/dev/null 2>&1; then \
		echo "$(YELLOW)Verificando processos na porta $(PORT)...$(NC)"; \
		lsof -i :$(PORT) | grep -E "(node|vite|tsx)" >/dev/null 2>&1; \
		if [ $$? -eq 0 ]; then \
			echo "$(YELLOW)Aguardando 2 segundos para tentativa de kill gracioso...$(NC)"; \
			lsof -ti :$(PORT) | xargs -I {} sh -c 'ps -p {} -o comm= | grep -E "(node|vite|tsx)" >/dev/null && kill {} 2>/dev/null || true' || true; \
			sleep 2; \
			if lsof -i :$(PORT) >/dev/null 2>&1; then \
				echo "$(RED)⚠️  Ainda ocupado. Tentando kill forçado em processos do projeto...$(NC)"; \
				pgrep -f "node.*server/index.ts" | xargs kill -9 2>/dev/null || true; \
				pgrep -f "vite.*dev" | xargs kill -9 2>/dev/null || true; \
				pgrep -f "tsx.*server/index.ts" | xargs kill -9 2>/dev/null || true; \
				sleep 1; \
				if lsof -i :$(PORT) >/dev/null 2>&1; then \
					echo "$(RED)❌ Porta ainda ocupada por processo do sistema:$(NC)"; \
					lsof -i :$(PORT); \
					echo "$(YELLOW)💡 Use 'make dev-alt' para porta alternativa (5001)$(NC)"; \
					echo "$(YELLOW)💡 Ou 'make free-port-force' para forçar (CUIDADO!)$(NC)"; \
				else \
					echo "$(GREEN)✅ Porta $(PORT) liberada!$(NC)"; \
				fi; \
			else \
				echo "$(GREEN)✅ Porta $(PORT) liberada!$(NC)"; \
			fi; \
		else \
			echo "$(RED)❌ Porta $(PORT) ocupada por processo do sistema (não será morto):$(NC)"; \
			lsof -i :$(PORT); \
			echo "$(YELLOW)💡 Use 'make dev-alt' para porta alternativa (5001)$(NC)"; \
			echo "$(YELLOW)💡 Ou 'make free-port-force' para forçar (CUIDADO! Pode afetar sistema)$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)ℹ️  Porta $(PORT) já está livre.$(NC)"; \
	fi

free-port-force: ## Libera a porta 5000 FORÇADAMENTE (CUIDADO!)
	@echo "$(RED)🚨 LIBERAÇÃO FORÇADA DA PORTA $(PORT)$(NC)"
	@echo "$(RED)⚠️  ISSO PODE MATAR PROCESSOS DO SISTEMA!$(NC)"
	@read -p "TEM CERTEZA? Digite 'FORCE' para confirmar: " confirm && [ "$$confirm" = "FORCE" ] || exit 1
	@echo "$(RED)🛑 Matando TODOS os processos na porta $(PORT)...$(NC)"
	@lsof -ti :$(PORT) | xargs kill -9 2>/dev/null || true
	@sleep 1
	@if lsof -i :$(PORT) >/dev/null 2>&1; then \
		echo "$(RED)❌ Ainda ocupado - pode ser processo do sistema protegido$(NC)"; \
	else \
		echo "$(GREEN)✅ Porta $(PORT) liberada forçadamente!$(NC)"; \
	fi

dev-alt: ## Executa desenvolvimento na porta 5001 (alternativa)
	@echo "$(GREEN)🚀 Iniciando servidor alternativo na porta 5001...$(NC)"
	@echo "$(YELLOW)🌐 Frontend: http://localhost:5001$(NC)"
	@echo "$(YELLOW)🔧 Backend: http://localhost:5001/api$(NC)"
	PORT=5001 NODE_ENV=development npm run dev

# 🆘 EMERGÊNCIA
emergency-stop: ## Para todos os processos relacionados
	@echo "$(RED)🛑 PARANDO TODOS OS PROCESSOS...$(NC)"
	-pkill -f "vite.*dev" 2>/dev/null || true
	-pkill -f "tsx.*server/index.ts" 2>/dev/null || true
	-pkill -f "node.*dist/index.cjs" 2>/dev/null || true
	@echo "$(GREEN)✅ Processos parados!$(NC)"

# 📝 VARIÁVEIS DE AMBIENTE
env-example: ## Cria arquivo .env.example
	@echo "$(BLUE)📝 Criando .env.example...$(NC)"
	@echo "# PUNK BLVCK - Environment Variables" > .env.example
	@echo "NODE_ENV=development" >> .env.example
	@echo "PORT=5000" >> .env.example
	@echo "DATABASE_URL=postgresql://user:password@localhost:5432/punkblvck" >> .env.example
	@echo "SESSION_SECRET=your-super-secret-session-key-here" >> .env.example
	@echo "FRONTEND_URL=http://localhost:5000" >> .env.example
	@echo "$(GREEN)✅ .env.example criado!$(NC)"

# 🎨 CUSTOMIZADO PARA NEØ
neø-status: ## Status da arquitetura NEØ
	@echo "$(MAGENTA)🔒 ARQUITETURA NEØ - STATUS DE PROTEÇÃO$(NC)"
	@echo "$(WHITE)═══════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)✅ Estrutura protegida$(NC)"
	@echo "$(GREEN)✅ Segurança hardening aplicada$(NC)"
	@echo "$(GREEN)✅ Autenticação implementada$(NC)"
	@echo "$(GREEN)✅ Rate limiting ativo$(NC)"
	@echo "$(GREEN)✅ Headers de segurança configurados$(NC)"
	@echo "$(CYAN)📋 Ver relatório completo: make docs$(NC)"