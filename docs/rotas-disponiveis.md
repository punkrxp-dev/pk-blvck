# 🛣️ ROTAS DISPONÍVEIS - PUNK BLVCK API

## 📍 **BASE URL**

```text
https://pk-blvck-production.up.railway.app
```

⚠️ **Nota:** Verifique `docs/links-disponiveis.md` para URLs atualizadas de produção.

---

## 🔐 **AUTENTICAÇÃO**

### **POST /api/auth/register**

-  **Descrição:** Registrar novo usuário
-  **Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

-  **Resposta:** `201 Created` - Dados do usuário (sem senha)
-  **Erros:** `409` (usuário existe), `400` (validação)

### **POST /api/auth/login**

-  **Descrição:** Login de usuário
-  **Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

-  **Resposta:** `200 OK` - Dados do usuário + mensagem
-  **Erros:** `401` (credenciais inválidas)

### **POST /api/auth/logout**

-  **Descrição:** Logout do usuário
-  **Autenticação:** Necessária (session)
-  **Resposta:** `200 OK` - Mensagem de sucesso

### **GET /api/auth/me**

-  **Descrição:** Obter dados do usuário logado
-  **Autenticação:** Necessária (session)
-  **Resposta:** `200 OK` - Dados do usuário
-  **Erros:** `401` (não autenticado)

---

## 👥 **USUÁRIOS**

### **GET /api/users**

-  **Descrição:** Lista usuários (exemplo - placeholder)
-  **Autenticação:** Necessária
-  **Resposta:** `200 OK` - Mensagem placeholder

---

## 🤖 **MCP (Main Control Panel)**

### **POST /api/mcp/ingest**

-  **Descrição:** Processar novo lead com IA completa + enriquecimento automático
-  **Autenticação:** CSRF token necessário
-  **Query Parameters:**
-  `mode`: `neo|legacy` (padrão: `neo`) - Modo de processamento
-  **Body (Dados fornecidos pelo usuário):**

```json
{
  "email": "joao.silva@empresa.com",
  "message": "Gostaria de conhecer a academia",  // ← Texto escrito pelo LEAD no formulário
  "source": "web"
}
```

**📝 IMPORTANTE:** O campo `message` contém a **mensagem escrita pelo próprio lead**. Este texto é preservado de forma imutável e apenas citado no email ao gestor. O sistema NUNCA modifica, reescreve ou envia respostas automáticas ao lead.

-  **Processamento Automático:**

-  🔍 **Enriquecimento Hunter.io** (busca dados públicos: nome, empresa, cargo)
-  🤖 **Classificação IA** (GPT-4o ou Gemini 2.0 Flash: high/medium/low/spam)
-  💾 **Salvamento no banco** (PostgreSQL via Drizzle ORM)
-  📧 **Notificação Resend** (se configurado, envia email ao gestor)

-  **Resposta:** `200 OK`

```json
{
  "success": true,
  "message": "Lead processed successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao.silva@empresa.com",
    "intent": "high",
    "confidence": 0.95,
    "reasoning": "Lead qualificado: CEO interessado em conhecer academia premium",
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

⚠️ **IMPORTANTE - Campos Opcionais:**

O objeto `enrichedData` contém dados **buscados automaticamente via Hunter.io API**. Todos os campos são **opcionais** e podem retornar `null` se:

-  Hunter.io não encontrar informações para o email
-  API key não estiver configurada (modo desenvolvimento usa mock data)
-  Email for muito recente ou sem presença digital pública

**Exemplo com dados parciais:**

```json
{
  "enrichedData": {
    "firstName": "João",
    "lastName": null,
    "company": "Empresa Tech",
    "position": null,
    "linkedin": null,
    "phone": null,
    "verified": false
  }
}
```

### **GET /api/mcp/health**

-  **Descrição:** Health check do sistema MCP
-  **Autenticação:** Não necessária
-  **Resposta:** `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T01:37:08.259Z",
  "ai": {
    "openai": "configured|not configured",
    "google": "configured|not configured",
    "hasAnyModel": true
  },
  "database": {
    "connected": true
  }
}
```

### **GET /api/mcp/leads**

-  **Descrição:** Listar leads com filtros, paginação e estatísticas
-  **Autenticação:** Não necessária (dashboard público)
-  **Query Parameters:**
-  `status`: `pending|processed|notified|failed` - Filtrar por status
-  `intent`: `high|medium|low|spam` - Filtrar por intenção
-  `page`: `número` (padrão: 1) - Página atual
-  `pageSize`: `1-100` (padrão: 20, máximo: 100) - Itens por página
-  `sortBy`: `createdAt|email|status|intent` (padrão: `createdAt`) - Campo para ordenação
-  `sortOrder`: `asc|desc` (padrão: `desc`) - Ordem de classificação
-  `dateRange`: `all|today|week|month` (padrão: `all`) - Filtro por período
-  **Resposta:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "lead@empresa.com",
      "rawMessage": "Gostaria de conhecer a academia",
      "source": "web",
      "enrichedData": {
        "firstName": "Maria",
        "lastName": "Santos",
        "company": "Empresa Tech",
        "position": "Diretora Comercial",
        "linkedin": "https://linkedin.com/in/mariasantos",
        "phone": "+55 11 98765-4321",
        "verified": true
      },
      "aiClassification": {
        "intent": "high",
        "confidence": 0.95,
        "reasoning": "Lead qualificado com interesse demonstrado",
        "model": "gpt-4o",
        "processedAt": "2026-01-17T10:30:00.000Z"
      },
      "status": "processed",
      "notifiedAt": "2026-01-17T10:30:15.000Z",
      "createdAt": "2026-01-17T10:30:00.000Z",
      "updatedAt": "2026-01-17T10:30:15.000Z"
    }
  ],
  "stats": {
    "total": 10,
    "high": 3,
    "medium": 3,
    "low": 2,
    "spam": 2,
    "processedToday": 5
  },
  "meta": {
    "count": 10,
    "limit": 20,
    "filters": {
      "status": null,
      "intent": null
    },
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 20,
      "totalPages": 3
    }
  }
}
```

⚠️ **Nota:** Campos em `enrichedData` podem ser `null` se Hunter.io não encontrar informações.

### **PATCH /api/mcp/leads/:id/status**

-  **Descrição:** Atualizar status de um lead
-  **Autenticação:** CSRF token necessário
-  **Body:**

```json
{
  "status": "pending|processed|notified|failed"
}
```

-  **Resposta:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processed",
    "updatedAt": "2026-01-17T10:30:15.000Z"
  }
}
```

-  **Erros:** `400` (status inválido), `404` (lead não encontrado)

### **PATCH /api/mcp/leads/:id/mark-spam**

-  **Descrição:** Marcar lead como spam (atualiza classificação IA)
-  **Autenticação:** CSRF token necessário
-  **Resposta:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "aiClassification": {
      "intent": "spam",
      "confidence": 1.0,
      "model": "gpt-4o",
      "processedAt": "2026-01-17T10:30:00.000Z"
    },
    "status": "processed",
    "updatedAt": "2026-01-17T10:30:15.000Z"
  }
}
```

-  **Erros:** `404` (lead não encontrado)

### **POST /api/mcp/leads/:id/notify**

-  **Descrição:** Enviar notificação para um lead (dispara email Resend)
-  **Autenticação:** CSRF token necessário
-  **Resposta:** `200 OK`

```json
{
  "success": true,
  "message": "Notification sent",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "notifiedAt": "2026-01-17T10:30:15.000Z",
    "status": "notified",
    "updatedAt": "2026-01-17T10:30:15.000Z"
  }
}
```

-  **Erros:** `404` (lead não encontrado)

### **DELETE /api/mcp/leads/:id**

-  **Descrição:** Deletar lead do banco de dados
-  **Autenticação:** CSRF token necessário
-  **Resposta:** `200 OK`

```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

-  **Erros:** `404` (lead não encontrado)

---

## 🔍 **ENRIQUECIMENTO AUTOMÁTICO DE DADOS**

### **Como funciona o Hunter.io Integration?**

Quando um lead é submetido via `/api/mcp/ingest`, o sistema **automaticamente busca dados públicos** para enriquecer o perfil:

#### **📥 Entrada (Fornecido pelo Usuário):**

```json
{
  "email": "contato@empresa.com",
  "message": "Quero conhecer",
  "source": "web"
}
```

#### **🔄 Processamento Interno:**

1.  **Observer Agent** recebe o email
2.  Chama `enrichLead(email)` → Hunter.io API
3.  Hunter.io consulta bancos de dados públicos:
    -  LinkedIn (perfis públicos)
    -  Registros WHOIS de domínios
    -  Bases de dados corporativas
    -  Redes sociais profissionais

#### **📤 Saída (Enriquecido Automaticamente):**

```json
{
  "email": "contato@empresa.com",
  "enrichedData": {
    "firstName": "Carlos",
    "lastName": "Mendes",
    "company": "Empresa Digital",
    "position": "CTO",
    "linkedin": "https://linkedin.com/in/carlosmendes",
    "phone": "+55 21 99876-5432",
    "verified": true
  }
}
```

### **🎯 Fontes de Dados:**

| Campo                               | Origem                                             | Obrigatório      |
|-------------------------------------|----------------------------------------------------|------------------|
| `email`, `message`, `source`        | **Usuário fornece**                                | ✅ Sim           |
| `firstName`, `lastName`             | **Hunter.io** (LinkedIn, registros públicos)       | ❌ Opcional      |
| `company`                           | **Hunter.io** (domínio do email + WHOIS)           | ❌ Opcional      |
| `position`                          | **Hunter.io** (LinkedIn scraping público)          | ❌ Opcional      |
| `linkedin`                          | **Hunter.io** (busca por email)                    | ❌ Opcional      |
| `phone`                             | **Hunter.io** (registros públicos)                 | ❌ Opcional      |
| `verified`                          | **Hunter.io** (verificação SMTP)                   | ❌ Opcional      |
| `intent`, `confidence`, `reasoning` | **IA** (GPT-4o/Gemini)                             | ✅ Sempre gerado |

### **⚙️ Configuração:**

```bash
# .env
HUNTER_API_KEY=your_hunter_api_key_here
```

-  **Com API Key:** Dados reais via Hunter.io
-  **Sem API Key:** Mock data para desenvolvimento

### **🔒 Privacidade:**

-  ✅ Apenas dados **públicos** são coletados
-  ✅ Nenhum dado sensível é armazenado sem consentimento
-  ✅ Conforme LGPD/GDPR (dados públicos profissionais)

---

## 🎨 **FRONTEND (Servido pelo Backend)**

### **GET /**

-  **Descrição:** Página inicial (landing page)
-  **Resposta:** HTML completo do React app

### **GET /dashboard**

-  **Descrição:** Dashboard de leads
-  **Resposta:** HTML do dashboard React

### **GET /static/**

-  **Descrição:** Assets estáticos (CSS, JS, imagens)
-  **Resposta:** Arquivos estáticos do build

---

## 🔒 **SEGURANÇA IMPLEMENTADA**

### **Rate Limiting**

-  **Global:** 1000 req/15min (desenvolvimento)
-  **API:** 2000 req/15min (desenvolvimento)
-  **Auth:** 5 tentativas/15min
-  **Registro:** 3/hora

### **Proteções**

-  ✅ **CSRF:** Tokens obrigatórios para POST/PUT/DELETE
-  ✅ **CORS:** Configurado para produção
-  ✅ **Helmet:** Headers de segurança completos
-  ✅ **XSS:** Sanitização automática de inputs
-  ✅ **SQL Injection:** Protegido por Drizzle ORM

---

## 🧪 **EXEMPLOS DE USO**

### **Testar Health Check**

```bash
curl https://pk-blvck-production.up.railway.app/api/mcp/health
```

### **Ver Leads no Dashboard**

```bash
curl https://pk-blvck-production.up.railway.app/api/mcp/leads
```

### **Acessar Dashboard**

```text
https://pk-blvck-three.vercel.app/dashboard
```

---

## 📊 **CÓDIGOS DE STATUS**

-  **200:** OK - Sucesso
-  **201:** Created - Recurso criado
-  **400:** Bad Request - Dados inválidos
-  **401:** Unauthorized - Não autenticado
-  **403:** Forbidden - CSRF token inválido
-  **409:** Conflict - Recurso já existe
-  **429:** Too Many Requests - Rate limit excedido
-  **500:** Internal Server Error - Erro interno

---

## 🎯 **NOTAS IMPORTANTES**

1.  **Enriquecimento Automático:** Leads são automaticamente enriquecidos via Hunter.io API (dados públicos)
2.  **Campos Opcionais:** Todos os campos em `enrichedData` podem retornar `null` se dados não forem encontrados
3.  **CSRF Protection:** Todas as rotas POST/PUT/PATCH/DELETE requerem header `x-csrf-token`
4.  **Rate Limiting:** Implementado em todas as rotas
5.  **Autenticação:** Apenas rotas `/api/auth/*` e `/api/users` requerem session
6.  **CORS:** Configurado para aceitar requisições do frontend Vercel
7.  **IA Fallback:** Sistema automaticamente usa Google AI (Gemini) se OpenAI (GPT-4o) falhar
8.  **Privacidade:** Apenas dados **públicos profissionais** são coletados (conforme LGPD/GDPR)
9.  **Modo de Processamento:** POST `/api/mcp/ingest` suporta `mode=neo` (padrão) ou `mode=legacy` via query parameter
10.  **Paginação:** GET `/api/mcp/leads` suporta paginação completa com `page`, `pageSize`, `sortBy`, `sortOrder` e `dateRange`

---

**📅 Última atualização:** Janeiro 2026
**🔄 Status:** Todas as rotas ativas e testadas
**🎸 API Version:** 2.0.0 - Security Hardened

---

<iframe src="https://github.com/sponsors/neomello/button" title="Sponsor neomello" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

**Author:** MELLØ // NEØ DEV

This project follows NEØ Protocol development standards.
Security is a priority, not an afterthought.
