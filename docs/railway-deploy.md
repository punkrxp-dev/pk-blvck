# 🚂 RAILWAY DEPLOY - PUNK BLVCK

## Configuração do Deploy no Railway

### ✅ Pré-requisitos

1. **Repositório GitHub:** https://github.com/punkrxp-dev/pk-blvck (já conectado)
2. **Database:** Neon Postgres ou Railway Postgres
3. **Environment Variables:** Configuradas no painel do Railway

---

## 🔧 Environment Variables Necessárias

### Obrigatórias
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=your-super-secret-key-here-min-32-chars
FRONTEND_URL=https://pk-blvck.vercel.app
```

### Opcionais (IA e Ferramentas)
```bash
# OpenAI (para leads inteligentes)
OPENAI_API_KEY=sk-proj-your-key-here

# Google AI (fallback gratuito)
GOOGLE_API_KEY=your-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here

# Hunter.io (enriquecimento de leads)
HUNTER_API_KEY=your-hunter-key-here

# Resend (notificações por email)
RESEND_API_KEY=re_your-key-here
RESEND_FROM_EMAIL=team@punkclub.com.br
NOTIFICATION_EMAIL=your-email@gmail.com
```

---

## 🚀 Processo de Deploy

### 1. Conectar Repositório
- Railway detecta automaticamente do GitHub
- Build automático após push

### 2. Configurar Database
- Railway provisiona Postgres automaticamente OU
- Use Neon: https://neon.tech (recomendado)

### 3. Health Check
- Endpoint: `/api/mcp/health`
- Timeout: 300s
- Auto-restart em caso de falha

### 4. URL da API
- Railway gera URL automática (ex: `https://pk-blvck-api.up.railway.app`)
- Configure no frontend Vercel: `VITE_API_URL=https://sua-url-railway`

---

## 📊 Status do Deploy

### ✅ Configurado
- Dockerfile otimizado para Railway
- railway.json com healthcheck
- Environment variables documentadas
- Auto-scaling habilitado

### 🔄 Em Andamento
- Railway fazendo build automático
- Database connection test
- Health checks ativos

### 🎯 Resultado Esperado
```
✅ Build: SUCCESS
✅ Database: CONNECTED
✅ Health Check: PASSING
✅ API URL: https://pk-blvck-api.up.railway.app
```

---

## 🧪 Testes Pós-Deploy

### 1. Health Check
```bash
curl https://your-railway-url.up.railway.app/api/mcp/health
# Deve retornar: {"status":"healthy",...}
```

### 2. API Test
```bash
curl -X POST https://your-railway-url.up.railway.app/api/mcp/ingest \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","message":"Test","source":"api"}'
```

### 3. Frontend Integration
- Atualizar Vercel com: `VITE_API_URL=https://your-railway-url`
- Testar dashboard completo

---

## 🚨 Troubleshooting

### Build Falhando
- Verificar logs no Railway dashboard
- Confirmar todas env vars obrigatórias
- Verificar DATABASE_URL connectivity

### Health Check Falhando
- Database connection issue
- Missing environment variables
- Port configuration problem

### API Não Respondendo
- CORS issues (verificar FRONTEND_URL)
- Rate limiting ativo
- Database query errors

---

## 🎉 Deploy Concluído!

Após deploy bem-sucedido:
1. ✅ **Backend:** `https://pk-blvck-api.up.railway.app`
2. ✅ **Frontend:** `https://pk-blvck.vercel.app`
3. ✅ **Database:** Neon Postgres
4. ✅ **AI:** OpenAI + Google (fallback)

**🎸 SISTEMA PUNK BLVCK TOTALMENTE OPERACIONAL!**