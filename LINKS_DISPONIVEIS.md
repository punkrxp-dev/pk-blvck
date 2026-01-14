# 🔗 LINKS DISPONÍVEIS - PUNK BLVCK

## 📊 **DASHBOARD PRINCIPAL**

### **Frontend (Vercel)**

- **URL:** https://pk-blvck.vercel.app
- **Projeto:** vercel.com/prxps-projects/pk-blvck
- **Status:** ✅ Ativo
- **Descrição:** Dashboard completo com visualização de leads em tempo real
- **Funcionalidades:**
  - 📊 KPIs de leads (total, alta intenção, processados hoje, spam)
  - 🎯 Classificação automática por IA (high/medium/low/spam)
  - 📋 Tabela de leads com dados enriquecidos
  - 🔄 Atualização em tempo real (polling a cada 5s)
  - 🎨 UI Punk Black com neon orange accents

### **API Backend (Railway)**

- **URL:** <https://pk-blvck-production.up.railway.app>
- **Status:** ✅ Ativo
- **Descrição:** API REST completa com IA integrada
- **Health Check:** https://pk-blvck-production.up.railway.app/api/mcp/health

---

## 🛠️ **FERRAMENTAS DE DESENVOLVIMENTO**

### **Repositório GitHub**
- **URL:** https://github.com/punkrxp-dev/pk-blvck
- **Status:** ✅ Público
- **Descrição:** Código fonte completo da aplicação
- **Branches:** main (produção)

### **Database (Neon Postgres)**
- **Painel:** https://console.neon.tech
- **Status:** ✅ Ativo
- **Descrição:** Banco PostgreSQL gerenciado na nuvem
- **Conexão:** Via DATABASE_URL (configurada)

---

## 🤖 **SERVIÇOS DE IA INTEGRADOS**

### **OpenAI (GPT-4o)**
- **Painel:** https://platform.openai.com
- **Status:** ✅ Configurado
- **Uso:** Classificação primária de leads, processamento complexo

### **Google AI (Gemini 2.0 Flash)**
- **Painel:** https://aistudio.google.com
- **Status:** ✅ Configurado
- **Uso:** Fallback automático quando OpenAI indisponível

### **Hunter.io (Enriquecimento)**
- **Painel:** https://hunter.io
- **Status:** ✅ Configurado
- **Uso:** Enriquecimento de dados de contato (nome, empresa, cargo)

### **Resend (Notificações)**
- **Painel:** https://resend.com
- **Status:** ✅ Configurado
- **Uso:** Notificações por email automáticas

---

## 📚 **DOCUMENTAÇÃO**

### **Documentos Internos**
- **Setup API Keys:** `docs/setup-api-keys.md`
- **Dashboard Guide:** `docs/dashboard-guide.md`
- **Security Audit:** `docs/security-audit-report.md`
- **MCP Orchestrator:** `docs/mcp-orchestrator.md`
- **AI Integration:** `docs/ai-integration-report.md`

### **Deploy Guides**
- **Railway Deploy:** `RAILWAY_DEPLOY.md`
- **Frontend Deploy:** Vercel automático via GitHub

---

## 🔍 **MONITORAMENTO**

### **Railway Dashboard**
- **URL:** https://railway.app/project/[project-id]
- **Status:** ✅ Ativo
- **Monitor:** Logs, métricas, health checks, redeploys

### **Vercel Dashboard**
- **URL:** https://vercel.com/prxps-projects/pk-blvck
- **Status:** ✅ Ativo
- **Monitor:** Deployments, analytics, logs

---

## 🎯 **TESTES FUNCIONAIS**

### **Endpoints de Teste**
```bash
# Health Check
curl https://pk-blvck-production.up.railway.app/api/mcp/health

# Lista de Leads
curl https://pk-blvck-production.up.railway.app/api/mcp/leads

# Ingestão de Lead (requer CSRF token)
curl -X POST https://pk-blvck-production.up.railway.app/api/mcp/ingest \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","message":"Teste","source":"demo"}'
```

---

## 📊 **ESTATÍSTICAS ATUAIS**

### **Leads Processados**
- **Total:** 10 leads
- **Alta Intenção:** 3 leads
- **Média Intenção:** 3 leads
- **Baixa Intenção:** 2 leads
- **Spam:** 2 leads

### **IA Performance**
- **OpenAI GPT-4o:** ✅ Funcionando
- **Google Gemini:** ✅ Funcionando (fallback)
- **Hunter.io:** ✅ Enriquecendo dados
- **Resend:** ✅ Pronto para notificações

---

## 🔒 **SEGURANÇA IMPLEMENTADA**

- ✅ **Rate Limiting:** 100 req/15min (desenvolvimento)
- ✅ **CSRF Protection:** Tokens obrigatórios
- ✅ **Helmet Security:** Headers de segurança
- ✅ **Input Validation:** Zod schemas
- ✅ **XSS Protection:** Sanitização automática
- ✅ **CORS:** Configurado para produção

---

## 🚀 **STATUS GERAL**

| Componente | Status | URL |
|------------|--------|-----|
| Frontend | ✅ Ativo | https://pk-blvck.vercel.app |
| Projeto Vercel | ✅ Ativo | vercel.com/prxps-projects/pk-blvck |
| Backend API | ✅ Ativo | https://pk-blvck-production.up.railway.app |
| Database | ✅ Ativo | Neon Postgres |
| OpenAI | ✅ Configurado | - |
| Google AI | ✅ Configurado | - |
| Hunter.io | ✅ Configurado | - |
| Resend | ✅ Configurado | - |
| GitHub | ✅ Público | https://github.com/punkrxp-dev/pk-blvck |

---

**🎸 SISTEMA PUNK BLVCK TOTALMENTE OPERACIONAL!**

**Última atualização:** Janeiro 2026
**Versão:** 2.0.0 - Security Hardened