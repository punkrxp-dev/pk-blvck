# 🛣️ ROTAS DISPONÍVEIS - PUNK BLVCK API

## 📍 **BASE URL**
```
https://pk-blvck-production.up.railway.app
```

---

## 🔐 **AUTENTICAÇÃO**

### **POST /api/auth/register**
- **Descrição:** Registrar novo usuário
- **Body:**
```json
{
  "username": "string",
  "password": "string"
}
```
- **Resposta:** `201 Created` - Dados do usuário (sem senha)
- **Erros:** `409` (usuário existe), `400` (validação)

### **POST /api/auth/login**
- **Descrição:** Login de usuário
- **Body:**
```json
{
  "username": "string",
  "password": "string"
}
```
- **Resposta:** `200 OK` - Dados do usuário + mensagem
- **Erros:** `401` (credenciais inválidas)

### **POST /api/auth/logout**
- **Descrição:** Logout do usuário
- **Autenticação:** Necessária (session)
- **Resposta:** `200 OK` - Mensagem de sucesso

### **GET /api/auth/me**
- **Descrição:** Obter dados do usuário logado
- **Autenticação:** Necessária (session)
- **Resposta:** `200 OK` - Dados do usuário
- **Erros:** `401` (não autenticado)

---

## 👥 **USUÁRIOS**

### **GET /api/users**
- **Descrição:** Lista usuários (exemplo - placeholder)
- **Autenticação:** Necessária
- **Resposta:** `200 OK` - Mensagem placeholder

---

## 🤖 **MCP (Main Control Panel)**

### **POST /api/mcp/ingest**
- **Descrição:** Processar novo lead com IA completa
- **Autenticação:** CSRF token necessário
- **Body:**
```json
{
  "email": "string (obrigatório)",
  "message": "string (opcional)",
  "source": "string (obrigatório)"
}
```
- **Processamento:**
  - 🤖 Classificação IA (high/medium/low/spam)
  - 🏢 Enriquecimento Hunter.io (nome, empresa, cargo)
  - 💾 Salvamento no banco
  - 📧 Notificação Resend (se configurado)
- **Resposta:** `200 OK`
```json
{
  "success": true,
  "message": "Lead processed successfully",
  "data": {
    "id": "uuid",
    "email": "string",
    "intent": "high|medium|low|spam",
    "confidence": 0.95,
    "reasoning": "string",
    "model": "gpt-4o|gemini-2.0-flash",
    "enrichedData": {
      "firstName": "string",
      "lastName": "string",
      "company": "string",
      "position": "string",
      "linkedin": "string",
      "phone": "string",
      "verified": true
    },
    "notified": true,
    "processingTime": 1250
  }
}
```

### **GET /api/mcp/health**
- **Descrição:** Health check do sistema MCP
- **Autenticação:** Não necessária
- **Resposta:** `200 OK`
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
- **Descrição:** Listar leads com filtros e estatísticas
- **Autenticação:** Não necessária (dashboard público)
- **Query Parameters:**
  - `status`: `pending|processed|notified|failed`
  - `intent`: `high|medium|low|spam`
  - `limit`: `1-100` (padrão: 50)
- **Resposta:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "rawMessage": "string",
      "source": "string",
      "enrichedData": {
        "firstName": "string",
        "lastName": "string",
        "company": "string",
        "position": "string",
        "linkedin": "string",
        "phone": "string",
        "verified": true
      },
      "aiClassification": {
        "intent": "high|medium|low|spam",
        "confidence": 0.95,
        "reasoning": "string",
        "model": "gpt-4o|gemini-2.0-flash",
        "processedAt": "2026-01-14T01:00:00.000Z"
      },
      "status": "pending|processed|notified|failed",
      "notifiedAt": "2026-01-14T01:00:00.000Z",
      "createdAt": "2026-01-14T01:00:00.000Z",
      "updatedAt": "2026-01-14T01:00:00.000Z"
    }
  ],
  "stats": {
    "total": 10,
    "high": 3,
    "medium": 3,
    "low": 2,
    "spam": 2,
    "processedToday": 0
  },
  "meta": {
    "count": 10,
    "limit": 50,
    "filters": {
      "status": null,
      "intent": null
    }
  }
}
```

---

## 🎨 **FRONTEND (Servido pelo Backend)**

### **GET /**
- **Descrição:** Página inicial (landing page)
- **Resposta:** HTML completo do React app

### **GET /dashboard**
- **Descrição:** Dashboard de leads
- **Resposta:** HTML do dashboard React

### **GET /static/**
- **Descrição:** Assets estáticos (CSS, JS, imagens)
- **Resposta:** Arquivos estáticos do build

---

## 🔒 **SEGURANÇA IMPLEMENTADA**

### **Rate Limiting**
- **Global:** 1000 req/15min (desenvolvimento)
- **API:** 2000 req/15min (desenvolvimento)
- **Auth:** 5 tentativas/15min
- **Registro:** 3/hora

### **Proteções**
- ✅ **CSRF:** Tokens obrigatórios para POST/PUT/DELETE
- ✅ **CORS:** Configurado para produção
- ✅ **Helmet:** Headers de segurança completos
- ✅ **XSS:** Sanitização automática de inputs
- ✅ **SQL Injection:** Protegido por Drizzle ORM

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
```
https://pk-blvck.vercel.app/dashboard
```

---

## 📊 **CÓDIGOS DE STATUS**

- **200:** OK - Sucesso
- **201:** Created - Recurso criado
- **400:** Bad Request - Dados inválidos
- **401:** Unauthorized - Não autenticado
- **403:** Forbidden - CSRF token inválido
- **409:** Conflict - Recurso já existe
- **429:** Too Many Requests - Rate limit excedido
- **500:** Internal Server Error - Erro interno

---

## 🎯 **NOTAS IMPORTANTES**

1. **CSRF Protection:** Todas as rotas POST/PUT/DELETE requerem header `x-csrf-token`
2. **Rate Limiting:** Implementado em todas as rotas
3. **Autenticação:** Apenas rotas `/api/auth/*` e `/api/users` requerem
4. **CORS:** Configurado para aceitar requisições do frontend Vercel
5. **IA Fallback:** Sistema automaticamente usa Google AI se OpenAI falhar

---

**📅 Última atualização:** Janeiro 2026
**🔄 Status:** Todas as rotas ativas e testadas
**🎸 API Version:** 2.0.0 - Security Hardened