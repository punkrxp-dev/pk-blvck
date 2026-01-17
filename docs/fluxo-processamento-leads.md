# 🔄 FLUXO COMPLETO DE PROCESSAMENTO DE LEADS

## 📋 **VISÃO GERAL**

Este documento detalha o **fluxo crítico** de processamento de leads no PUNK BLVCK, desde a entrada até a notificação do gestor.

---

## 🎯 **1. ENTRADA DO LEAD**

### **Ponto de Entrada: POST /api/mcp/ingest**

```json
{
  "email": "joao.silva@empresa.com",
  "message": "Gostaria de conhecer a academia",
  "source": "web"
}
```

**Usuário fornece apenas 3 campos:**

-  `email` (obrigatório)
-  `message` (opcional)
-  `source` (obrigatório: 'web', 'api', 'webhook', etc)

---

## 🤖 **2. PIPELINE MCP (Model Context Protocol)**

### **Arquivo:** `server/ai/mcp/pipeline.ts`

O pipeline orquestra 3 agents cognitivos em sequência:

```text
┌──────────────────────────────────────────────────────────────┐
│                     MCP COORDINATOR                          │
│                  (server/ai/mcp/index.ts)                    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   1️⃣ SENTINEL AGENT (Entry Layer)      │
        │   Validação & Detecção de Spam          │
        │   • Valida formato de email              │
        │   • Detecta domínios temporários         │
        │   • Identifica padrões suspeitos         │
        │   • Sanitiza inputs                      │
        └─────────────────────────────────────────┘
                              │
                    ✅ Aprovado │ ❌ Spam
                              ▼
        ┌─────────────────────────────────────────┐
        │   2️⃣ OBSERVER AGENT (Presence Layer)   │
        │   Enriquecimento Hunter.io               │
        │   • Busca dados públicos                 │
        │   • Nome, empresa, cargo                 │
        │   • LinkedIn, telefone                   │
        │   • Verificação de email                 │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   3️⃣ INTENT AGENT (Intent Layer)       │
        │   Classificação IA                       │
        │   • GPT-4o (primário)                    │
        │   • Gemini 2.0 Flash (fallback)          │
        │   • Classifica: high/medium/low/spam     │
        │   • Gera resposta personalizada          │
        │   • Usa memória vetorial (contexto)      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   4️⃣ PERSISTENCE LAYER                 │
        │   Salvamento no Banco                    │
        │   • PostgreSQL via Drizzle ORM           │
        │   • Tabela: leads                        │
        │   • Status: processed/failed             │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   5️⃣ NOTIFICATION LAYER                │
        │   Email para Gestor (Resend API)        │
        │   • Apenas se status !== 'failed'        │
        │   • Template baseado em intent           │
        │   • Destinatário: NOTIFICATION_EMAIL     │
        └─────────────────────────────────────────┘
```

---

## 📧 **3. API DE EMAIL (RESEND)**

### **Configuração Necessária (.env)**

```bash
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx          # Obrigatório para enviar emails reais
RESEND_FROM_EMAIL=leads@punkblvck.com.br    # Email remetente (seu domínio verificado)
NOTIFICATION_EMAIL=gestor@punkblvck.com.br  # Email do gestor (quem recebe notificações)
```

### **⚙️ Como Configurar Resend**

1.  **Criar conta gratuita:** <https://resend.com>
2.  **Verificar domínio:** Adicionar registros DNS (MX, TXT)
3.  **Obter API Key:** Dashboard → API Keys → Create
4.  **Plano gratuito:** 100 emails/dia (suficiente para início)

### **📋 Status Atual**

#### **✅ Código Implementado:**

-  Integração completa com Resend API
-  Templates de email por nível de prioridade
-  Fallback para logs se API não configurada
-  Tratamento de erros robusto

#### **⚠️ Configuração Pendente:**

-  `RESEND_API_KEY` não configurada (modo desenvolvimento)
-  `RESEND_FROM_EMAIL` usando fallback: `onboarding@resend.dev`
-  `NOTIFICATION_EMAIL` usando fallback: `admin@example.com`

#### **🚀 Próximos Passos:**

1.  Criar conta Resend
2.  Verificar domínio `punkblvck.com.br`
3.  Configurar variáveis de ambiente na Vercel/Railway
4.  Testar envio de email real

---

## 📨 **4. TEMPLATES DE NOTIFICAÇÃO**

### **Arquivo:** `server/ai/tools/notification.tool.ts`

### **🔴 High Priority Lead**

```text
Subject: High-Priority Lead Alert
Body: A high-priority lead has been identified: joao.silva@empresa.com. 
      Immediate follow-up recommended.
```

**Quando:** `intent === 'high'` (CEO, Diretor, cargo sênior + interesse claro)

### **🟡 Medium Priority Lead**

```text
Subject: Medium-Priority Lead
Body: A medium-priority lead has been captured: maria@startup.com. 
      Follow-up within 24 hours.
```

**Quando:** `intent === 'medium'` (interesse moderado, cargo intermediário)

### **🟢 Low Priority Lead**

```text
Subject: New Lead Captured
Body: A new lead has been added: contato@empresa.com. 
      Standard follow-up process.
```

**Quando:** `intent === 'low'` (interesse baixo, sem urgência)

### **🚫 Spam Detected**

```text
Subject: Spam Lead Detected
Body: Potential spam lead detected: fake@temp-mail.com. 
      Review required.
```

**Quando:** `intent === 'spam'` ou bloqueado pelo Sentinel

**⚠️ Nota:** Emails de spam **não disparam notificação** por padrão (apenas log).

---

## 🔍 **5. DETALHAMENTO DOS AGENTS**

### **5.1. SENTINEL AGENT (Entry Layer)**

**Arquivo:** `server/ai/agents/sentinel.agent.ts`

**Responsabilidade:** Primeira linha de defesa

**O que faz:**

-  ✅ Valida formato de email (RFC 5322)
-  ✅ Detecta domínios descartáveis (10minutemail, guerrillamail, etc)
-  ✅ Identifica padrões suspeitos (muitos números, caracteres repetidos)
-  ✅ Valida fonte permitida (web, api, webhook, manual, test)
-  ✅ Sanitiza inputs (remove scripts, SQL injection)
-  ✅ Bloqueia ataques XSS

**Output:**

```typescript
{
  email: "joao.silva@empresa.com",
  source: "web",
  rawMessage: "Gostaria de conhecer a academia",
  sanitized: true,      // Input foi sanitizado?
  spam: false,          // É spam?
  confidence: 1.0       // Confiança na decisão
}
```

**Se detectar spam:** Pipeline é **interrompido**, lead marcado como `failed`.

---

### **5.2. OBSERVER AGENT (Presence Layer)**

**Arquivo:** `server/ai/agents/observer.agent.ts`

**Responsabilidade:** Enriquecimento de dados

**O que faz:**

1.  Recebe email validado pelo Sentinel
2.  Chama `enrichLead(email)` → `server/ai/tools/enrichment.tool.ts`
3.  Busca dados via **Hunter.io API**:
    -  Nome (firstName, lastName)
    -  Empresa (company)
    -  Cargo (position)
    -  LinkedIn (linkedin)
    -  Telefone (phone)
    -  Verificação de email (verified)

**Fontes de Dados (Hunter.io):**

-  LinkedIn (perfis públicos)
-  Registros WHOIS de domínios
-  Bases de dados corporativas
-  Redes sociais profissionais

**Output:**

```typescript
{
  firstName: "João",
  lastName: "Silva",
  company: "Empresa Tech Ltda",
  position: "CEO",
  linkedin: "https://linkedin.com/in/joaosilva",
  phone: "+55 11 98765-4321",
  verified: true,
  dataSource: "hunter"  // ou "mock" em desenvolvimento
}
```

**⚠️ Campos Opcionais:** Todos os campos podem ser `null` se Hunter.io não encontrar dados.

**Configuração:**

```bash
HUNTER_API_KEY=your_hunter_api_key_here
```

-  **Com API Key:** Dados reais (50 buscas/mês grátis)
-  **Sem API Key:** Mock data para desenvolvimento

---

### **5.3. INTENT AGENT (Intent Layer)**

**Arquivo:** `server/ai/agents/intent.agent.ts`

**Responsabilidade:** Classificação inteligente com IA

**O que faz:**

1.  Recebe dados enriquecidos do Observer
2.  Consulta **memória vetorial** (leads similares do mesmo domínio)
3.  Monta prompt contextualizado com:
    -  Email
    -  Mensagem do usuário
    -  Dados enriquecidos (nome, empresa, cargo)
    -  Histórico de leads do mesmo domínio
4.  Chama **GPT-4o** (primário) ou **Gemini 2.0 Flash** (fallback)
5.  IA analisa e retorna:
    -  `intent`: high/medium/low/spam
    -  `confidence`: 0.0 a 1.0
    -  `reasoning`: Justificativa da classificação
    -  `userReply`: Resposta personalizada para o lead

**Critérios de Classificação:**

#### **🔴 HIGH (Alta Prioridade):**

-  Cargo sênior (CEO, CTO, Diretor, Founder)
-  Mensagem demonstra interesse claro
-  Empresa relevante
-  Email verificado

**Exemplo:** "CEO de startup interessado em plano corporativo"

#### **🟡 MEDIUM (Média Prioridade):**

-  Cargo intermediário (Gerente, Coordenador)
-  Interesse moderado
-  Mensagem genérica

**Exemplo:** "Gerente de RH perguntando sobre valores"

#### **🟢 LOW (Baixa Prioridade):**

-  Cargo júnior ou não identificado
-  Mensagem muito curta ou vaga
-  Sem dados de enriquecimento

**Exemplo:** "Contato sem informações claras"

#### **🚫 SPAM:**

-  Email temporário detectado
-  Padrões suspeitos
-  Conteúdo malicioso

**Output:**

```typescript
{
  intent: "high",
  confidence: 0.95,
  reasoning: "CEO de empresa tech demonstrando interesse em plano premium",
  userReply: "Olá João! Que ótimo receber seu contato. Vamos agendar uma visita?",
  similarLeads: ["uuid-1", "uuid-2"]  // Leads similares para contexto
}
```

**Circuit Breaker:** Protege contra falhas da API de IA com retry exponencial.

---

## 💾 **6. PERSISTENCE LAYER**

**Arquivo:** `server/ai/tools/persistence.tool.ts`

**O que faz:**

1.  Recebe dados processados dos 3 agents
2.  Salva na tabela `leads` (PostgreSQL)
3.  Retorna UUID do lead criado

**Estrutura no Banco:**

```sql
leads {
  id: uuid (primary key)
  email: string (unique)
  rawMessage: string
  source: string
  
  enrichedData: jsonb {
    firstName, lastName, company, position, linkedin, phone, verified
  }
  
  aiClassification: jsonb {
    intent, confidence, reasoning, userReply, model, processedAt
  }
  
  processingMetadata: jsonb {
    processingMode, modelProvider, actualModel, fallbackUsed,
    requiresHumanReview, processingTimeMs, timestamp, layers
  }
  
  status: string (pending|processed|notified|failed)
  notifiedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 📧 **7. NOTIFICATION LAYER**

**Arquivo:** `server/ai/tools/notification.tool.ts`

### **Fluxo de Notificação:**

```text
1. Pipeline verifica: status !== 'failed'
   ├─ Se failed (spam): NÃO notifica
   └─ Se processed: Prossegue

2. Monta template baseado em intent:
   ├─ high: "High-Priority Lead Alert"
   ├─ medium: "Medium-Priority Lead"
   ├─ low: "New Lead Captured"
   └─ spam: "Spam Lead Detected" (apenas log)

3. Chama Resend API:
   POST https://api.resend.com/emails
   Headers:
     Authorization: Bearer {RESEND_API_KEY}
     Content-Type: application/json
   Body:
     from: RESEND_FROM_EMAIL
     to: NOTIFICATION_EMAIL
     subject: template.subject
     html: <p>template.body</p>

4. Resultado:
   ├─ Sucesso: notified = true
   └─ Erro: notified = false (log apenas)
```

### **Destinatário do Email:**

**Quem recebe:** O **GESTOR** da academia (não o lead!)

-  Email configurado em `NOTIFICATION_EMAIL`
-  Fallback: `admin@example.com` (desenvolvimento)

**⚠️ IMPORTANTE:**

-  O lead **NÃO recebe email automaticamente**
-  O sistema **notifica o gestor** sobre o novo lead
-  Cabe ao gestor fazer o follow-up comercial

### **Resposta Personalizada (userReply):**

A IA gera uma resposta sugerida que o gestor pode usar:

```text
Lead: joao.silva@empresa.com

IA sugere responder:
"Olá João! Que ótimo receber seu contato. Nossa academia oferece
planos corporativos personalizados. Posso agendar uma visita?"
```

**Uso:** O gestor vê essa sugestão no dashboard e pode:

-  Copiar e enviar diretamente
-  Adaptar conforme necessário
-  Usar como base para abordagem comercial

---

## 🎯 **8. RESPOSTA FINAL DA API**

### **Sucesso (200 OK):**

```json
{
  "success": true,
  "message": "Lead processed successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao.silva@empresa.com",
    "intent": "high",
    "confidence": 0.95,
    "reasoning": "CEO interessado em conhecer academia premium",
    "model": "gpt-4o",
    "enrichedData": {
      "firstName": "João",
      "lastName": "Silva",
      "company": "Empresa Tech Ltda",
      "position": "CEO",
      "linkedin": "https://linkedin.com/in/joaosilva",
      "phone": "+55 11 98765-4321",
      "verified": true
    },
    "notified": true,
    "processingTime": 1250
  }
}
```

### **Erro (500 Internal Server Error):**

```json
{
  "success": false,
  "message": "Failed to process lead",
  "error": "OpenAI API timeout"
}
```

---

## ⚡ **9. PERFORMANCE & OTIMIZAÇÕES**

### **Tempo Médio de Processamento:**

-  **Sentinel:** ~50ms (validação local)
-  **Observer:** ~300ms (Hunter.io API)
-  **Intent:** ~800ms (GPT-4o API)
-  **Persistence:** ~50ms (PostgreSQL)
-  **Notification:** ~200ms (Resend API)

**Total:** ~1.4s (tempo real pode variar)

### **Otimizações Implementadas:**

#### **Cache Inteligente:**

-  **Embeddings:** Cache LRU com TTL de 1 hora
-  **Contextos:** Cache de leads similares
-  **Enriquecimento:** Cache de dados Hunter.io (evita buscas duplicadas)

#### **Circuit Breaker:**

-  Protege APIs de IA contra falhas em cascata
-  Retry exponencial para rate limits
-  Fallback automático: OpenAI → Google AI → Regras

#### **Lazy Loading:**

-  Modelos de IA carregados sob demanda
-  Reduz cold start time em ~40%

#### **Memory Vetorial:**

-  Armazena embeddings de leads processados
-  Busca por similaridade em O(log n)
-  Contexto histórico para melhor classificação

---

## 🔒 **10. SEGURANÇA IMPLEMENTADA**

### **Validação em Múltiplas Camadas:**

1.  **API Routes:** Zod validation
2.  **Sentinel Agent:** Email format, disposable domains, suspicious patterns
3.  **Observer Agent:** Domain validation, data sanitization
4.  **Intent Agent:** Content validation, malicious detection

### **Proteções:**

-  ✅ XSS Prevention (DOMPurify)
-  ✅ SQL Injection (Drizzle ORM parametrizado)
-  ✅ CSRF Tokens
-  ✅ Rate Limiting (5 req/15min por IP)
-  ✅ Input Sanitization (remove scripts, tags HTML)
-  ✅ Email Verification (SMTP check via Hunter.io)

### **Privacidade (LGPD/GDPR):**

-  ✅ Apenas dados **públicos profissionais** coletados
-  ✅ Consentimento implícito ao submeter formulário
-  ✅ Dados armazenados com finalidade específica
-  ✅ Possibilidade de exclusão (DELETE /api/mcp/leads/:id)

---

## 📊 **11. MONITORAMENTO & LOGS**

### **Structured Logging:**

```typescript
log('NEO MCP PIPELINE - Processing Started', 'mcp-pipeline');
log('SENTINEL: Email validated', 'sentinel-agent');
log('OBSERVER: Data enriched via Hunter.io', 'observer-agent');
log('INTENT: Classified as HIGH (0.95 confidence)', 'intent-agent');
log('PERSISTENCE: Saved to database (uuid)', 'persistence');
log('NOTIFICATION: Email sent via Resend', 'notification');
log('NEO MCP PIPELINE - Completed in 1250ms', 'mcp-pipeline');
```

### **Métricas Rastreadas:**

-  Processing time por agent
-  Taxa de sucesso/falha
-  Taxa de spam detectado
-  Circuit breaker hits
-  Cache hit rate
-  API call counts (OpenAI, Google, Hunter, Resend)

---

## 🚀 **12. PRÓXIMOS PASSOS CRÍTICOS**

### **🔴 ALTA PRIORIDADE:**

#### **1. Configurar Resend API**

-  [ ] Criar conta Resend
-  [ ] Verificar domínio `punkblvck.com.br`
-  [ ] Obter API Key
-  [ ] Configurar variáveis:
-  `RESEND_API_KEY`
-  `RESEND_FROM_EMAIL=leads@punkblvck.com.br`
-  `NOTIFICATION_EMAIL=gestor@punkblvck.com.br`

#### **2. Testar Fluxo Completo**

-  [ ] Enviar lead de teste via dashboard
-  [ ] Verificar recebimento de email
-  [ ] Validar dados enriquecidos
-  [ ] Confirmar classificação de IA

#### **3. Ajustar Templates de Email**

-  [ ] Personalizar mensagens em PT-BR
-  [ ] Adicionar link direto para dashboard
-  [ ] Incluir dados do lead no corpo do email
-  [ ] Adicionar botão de ação (Ex: "Ver Lead Completo")

### **🟡 MÉDIA PRIORIDADE:**

#### **4. Automação de Resposta**

-  [ ] Implementar envio automático de `userReply` para o lead
-  [ ] Adicionar opt-in no formulário
-  [ ] Template HTML profissional
-  [ ] Tracking de abertura/cliques

#### **5. Dashboard de Gestão**

-  [ ] Adicionar botão "Enviar Email" direto do dashboard
-  [ ] Integrar com Gmail/Outlook do gestor
-  [ ] Sugestão de resposta (userReply) em destaque
-  [ ] Histórico de interações

#### **6. Melhorias no Enriquecimento**

-  [ ] Adicionar mais fontes (Clearbit, FullContact)
-  [ ] Fallback secundário se Hunter.io falhar
-  [ ] Score de qualidade do lead
-  [ ] Integração com CRM

---

## 🎯 **13. RESUMO EXECUTIVO**

### **Como o Sistema Funciona:**

1.  **Lead entra** via formulário web (email + mensagem)
2.  **Sentinel valida** e bloqueia spam
3.  **Observer enriquece** com Hunter.io (nome, empresa, cargo)
4.  **Intent classifica** com IA (high/medium/low) e gera resposta
5.  **Sistema salva** no banco PostgreSQL
6.  **Resend envia email** para o **GESTOR** (não para o lead)
7.  **Gestor acessa dashboard** e vê lead completo com sugestão de resposta

### **Configuração Atual:**

| Item              | Status              | Ação Necessária               |
|-------------------|---------------------|-------------------------------|
| **Hunter.io API** | ⚠️ Não configurada  | Adicionar `HUNTER_API_KEY`    |
| **Resend API**    | ⚠️ Não configurada  | Adicionar `RESEND_API_KEY`    |
| **OpenAI API**    | ✅ Configurada      | Nenhuma                       |
| **Google AI API** | ✅ Configurada      | Nenhuma                       |
| **PostgreSQL**    | ✅ Funcionando      | Nenhuma                       |

### **O que Precisa Fazer AGORA:**

1.  **Configurar Resend** (20 min):
    -  Criar conta: <https://resend.com>
    -  Verificar domínio `punkblvck.com.br`
    -  Adicionar variáveis no Railway/Vercel

2.  **Configurar Hunter.io** (10 min):
    -  Criar conta: <https://hunter.io>
    -  Obter API Key (50 buscas/mês grátis)
    -  Adicionar `HUNTER_API_KEY` no Railway/Vercel

3.  **Testar Sistema** (15 min):
    -  Enviar lead de teste
    -  Verificar email recebido
    -  Validar dados no dashboard

**Total:** ~45 minutos para ter o sistema **100% operacional**.

---

**📅 Última atualização:** Janeiro 2026
**🔄 Status:** Documentação completa e atualizada
**🎸 Sistema Version:** 2.0.0 - NEO Protocol

---

<iframe src="https://github.com/sponsors/neomello/button" title="Sponsor neomello" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

**Author:** MELLØ // NEØ DEV

This project follows NEØ Protocol development standards.
Security is a priority, not an afterthought.
