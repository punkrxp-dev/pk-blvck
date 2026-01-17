# 🔗 LINKS DISPONÍVEIS - PUNK BLVCK

## 📊 **DASHBOARD PRINCIPAL**

### **Frontend (Vercel)**

-  **URL:** <https://pk-blvck-three.vercel.app>
-  **Projeto:** vercel.com/prxps-projects/pk-blvck
-  **Status:** ✅ Ativo (Deploy automático)
-  **Descrição:** Dashboard completo com visualização de leads em tempo real
-  **Funcionalidades:**
  -  📊 KPIs de leads (total, alta intenção, processados hoje, spam)
  -  🎯 Classificação automática por IA (alto/médio/baixo/spam)
  -  📋 Tabela de leads com dados enriquecidos
  -  🔄 Atualização em tempo real (polling a cada 5s)
  -  🎨 UI Punk Black com neon orange accents

### **API Backend (Railway)**

-  **URL:** <https://pk-blvck-production.up.railway.app>
-  **Status:** ✅ Ativo
-  **Descrição:** API REST completa com IA integrada
-  **Health Check:** <https://pk-blvck-production.up.railway.app/api/mcp/health>

---

## 🛠️ **FERRAMENTAS DE DESENVOLVIMENTO**

### **Repositório GitHub**

-  **URL:** <https://github.com/punkrxp-dev/pk-blvck>
-  **Status:** ✅ Público
-  **Descrição:** Código fonte completo da aplicação
-  **Branches:** main (produção)

### **Database (Neon Postgres)**

-  **Painel:** <https://console.neon.tech>
-  **Status:** ✅ Ativo
-  **Descrição:** Banco PostgreSQL gerenciado na nuvem
-  **Conexão:** Via DATABASE_URL (configurada)

---

## 🤖 **SERVIÇOS DE IA INTEGRADOS**

### **OpenAI (GPT-4o)**

-  **Painel:** <https://platform.openai.com>
-  **Status:** ✅ Configurado
-  **Uso:** Classificação primária de leads, processamento complexo

### **Google AI (Gemini 2.0 Flash)**

-  **Painel:** <https://aistudio.google.com>
-  **Status:** ✅ Configurado
-  **Uso:** Fallback automático quando OpenAI indisponível

### **Hunter.io (Enriquecimento)**

-  **Painel:** <https://hunter.io>
-  **Status:** ✅ Configurado
-  **Uso:** Enriquecimento de dados de contato (nome, empresa, cargo)

### **Resend (Notificações)**

-  **Painel:** <https://resend.com>
-  **Status:** ✅ Configurado
-  **Uso:** Notificações por email automáticas

---

## 📚 **DOCUMENTAÇÃO**

### **Documentos Internos**

-  **Setup API Keys:** `setup-api-keys.md`
-  **Dashboard Guide:** `dashboard-guide.md`
-  **Security Audit:** `security-audit-report.md`
-  **MCP Orchestrator:** `mcp-orchestrator.md`
-  **AI Integration:** `ai-integration-report.md`

### **Deploy Guides**

-  **Railway Deploy:** `railway-deploy.md`
-  **Frontend Deploy:** Vercel automático via GitHub

---

## 🔍 **MONITORAMENTO**

### **Railway Dashboard**

-  **URL:** <https://railway.app/project/[project-id>]
-  **Status:** ✅ Ativo
-  **Monitor:** Logs, métricas, health checks, redeploys

### **Vercel Dashboard**

-  **URL:** <https://vercel.com/prxps-projects/pk-blvck>
-  **Status:** ✅ Ativo
-  **Monitor:** Deployments, analytics, logs

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

-  **Total:** 10 leads
-  **Alta Intenção:** 3 leads (alto)
-  **Média Intenção:** 3 leads (médio)
-  **Baixa Intenção:** 2 leads (baixo)
-  **Spam:** 2 leads

### **IA Performance**

-  **OpenAI GPT-4o:** ✅ Funcionando
-  **Google Gemini:** ✅ Funcionando (fallback)
-  **Hunter.io:** ✅ Enriquecendo dados
-  **Resend:** ✅ Pronto para notificações

---

## 🔒 **SEGURANÇA IMPLEMENTADA**

-  ✅ **Rate Limiting:** 100 req/15min (desenvolvimento)
-  ✅ **CSRF Protection:** Tokens obrigatórios
-  ✅ **Helmet Security:** Headers de segurança
-  ✅ **Input Validation:** Zod schemas
-  ✅ **XSS Protection:** Sanitização automática
-  ✅ **CORS:** Configurado para produção

---

## 🚀 **STATUS GERAL**

| Componente | Status | URL |
|------------|--------|-----|
| Frontend | ✅ Ativo | <https://pk-blvck-three.vercel.app> |
| Projeto Vercel | ✅ Ativo | vercel.com/prxps-projects/pk-blvck |
| Backend API | ✅ Ativo | <https://pk-blvck-production.up.railway.app> |
| Database | ✅ Ativo | Neon Postgres |
| OpenAI | ✅ Configurado | - |
| Google AI | ✅ Configurado | - |
| Hunter.io | ✅ Configurado | - |
| Resend | ✅ Configurado | - |
| GitHub | ✅ Público | <https://github.com/punkrxp-dev/pk-blvck> |

---

## ✅ **CONFIGURAÇÕES CONCLUÍDAS**

### ✅ **CORS Issue - RESOLVIDO**

**Status:** 🟢 CONCLUÍDO - Sistema funcionando perfeitamente

**Problema resolvido:** Frontend consegue acessar API normalmente

```
✅ Access granted: https://pk-blvck-production.up.railway.app/api/mcp/leads
from origin https://pk-blvck-three.vercel.app
```

**Solução aplicada:**

-  ✅ Variável `FRONTEND_URL=https://pk-blvck-three.vercel.app` configurada no Railway
-  ✅ Redeploy realizado com sucesso
-  ✅ Conexão frontend-backend funcionando 100%

**Teste de confirmação:**

```bash
✅ Frontend: PUNK | BLVCK
✅ API Health: healthy
✅ API Leads: true
```

---

**🎸 SISTEMA PUNK BLVCK TOTALMENTE OPERACIONAL!**

**Última atualização:** Janeiro 2026
**Versão:** 2.0.0 - Security Hardened

---

<iframe src="https://github.com/sponsors/neomello/button" title="Sponsor neomello" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

**Author:** MELLØ // NEØ DEV

This project follows NEØ Protocol development standards.
Security is a priority, not an afterthought.
