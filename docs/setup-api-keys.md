# 🔑 GUIA DE CONFIGURAÇÃO - API KEYS

## 📋 RESUMO EXECUTIVO

Para rodar o **seed de dados** e o **Dashboard**, você precisa **APENAS**:
- ✅ **DATABASE_URL** (Neon Postgres - GRÁTIS)

As outras chaves são **OPCIONAIS** e só necessárias se quiser usar as features de IA/MCP.

---

## 🗄️ 1. DATABASE_URL (OBRIGATÓRIO)

### O que é?
String de conexão com o banco PostgreSQL onde os leads serão salvos.

### Onde conseguir? (GRÁTIS)
**🔗 https://neon.tech**

### Passo a passo:
1. Acesse https://neon.tech
2. Clique em **"Sign Up"** (pode usar GitHub)
3. Crie um novo projeto:
   - Nome: `punk-blvck` (ou qualquer nome)
   - Região: `US East (Ohio)` (mais rápido para Brasil)
4. Na dashboard do projeto, clique em **"Connection String"**
5. Copie a string que aparece (formato: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)
6. Cole no `.env`:
   ```bash
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
   ```

### Alternativa Local (PostgreSQL local):
Se preferir usar PostgreSQL local:
```bash
# Instalar PostgreSQL (Mac)
brew install postgresql@16
brew services start postgresql@16

# Criar database
createdb punkblvck

# Configurar no .env
DATABASE_URL=postgresql://localhost:5432/punkblvck
```

---

## 🤖 2. OPENAI_API_KEY (OPCIONAL)

### O que é?
Chave para usar GPT-4o na classificação de leads.

### Onde conseguir? (PAGO - mas tem créditos grátis)
**🔗 https://platform.openai.com/api-keys**

### Passo a passo:
1. Acesse https://platform.openai.com/signup
2. Crie uma conta
3. Vá em **API Keys** no menu lateral
4. Clique em **"Create new secret key"**
5. Copie a chave (começa com `sk-proj-...`)
6. Cole no `.env`:
   ```bash
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```

### Preço:
- **Grátis:** $5 de créditos para novos usuários
- **Depois:** ~$0.01 por 1000 tokens (muito barato para MVP)

### Quando preciso?
Só se quiser que a IA classifique leads automaticamente (high/medium/low/spam).

---

## 🧠 3. GOOGLE_API_KEY (OPCIONAL)

### O que é?
Chave para usar Gemini 2.0 Flash (alternativa ao GPT-4o).

### Onde conseguir? (GRÁTIS - 1500 requests/dia)
**🔗 https://aistudio.google.com/app/apikey**

### Passo a passo:
1. Acesse https://aistudio.google.com/app/apikey
2. Faça login com conta Google
3. Clique em **"Create API Key"**
4. Copie a chave
5. Cole no `.env`:
   ```bash
   GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
   ```

### Preço:
- **Grátis:** 1500 requests/dia (suficiente para MVP)
- **Depois:** Muito barato (mais barato que OpenAI)

### Quando preciso?
Alternativa ao OpenAI. Você pode usar só um dos dois.

---

## 🔍 4. HUNTER_API_KEY (OPCIONAL)

### O que é?
Serviço para enriquecer dados de leads (buscar nome, empresa, LinkedIn, etc a partir do email).

### Onde conseguir? (GRÁTIS - 25 searches/mês)
**🔗 https://hunter.io/users/sign_up**

### Passo a passo:
1. Acesse https://hunter.io/users/sign_up
2. Crie uma conta
3. Vá em **API** no menu
4. Copie a **API Key**
5. Cole no `.env`:
   ```bash
   HUNTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Preço:
- **Grátis:** 25 buscas/mês
- **Starter ($49/mês):** 500 buscas/mês

### Quando preciso?
Só se quiser enriquecer automaticamente os dados dos leads (nome, empresa, cargo).

---

## 📧 5. RESEND_API_KEY (OPCIONAL)

### O que é?
Serviço para enviar emails de notificação quando chegar lead novo.

### Onde conseguir? (GRÁTIS - 100 emails/dia)
**🔗 https://resend.com/signup**

### Passo a passo:
1. Acesse https://resend.com/signup
2. Crie uma conta
3. Vá em **API Keys**
4. Crie uma nova chave
5. Cole no `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=onboarding@yourdomain.com
   NOTIFICATION_EMAIL=seu-email@gmail.com
   ```

### Preço:
- **Grátis:** 100 emails/dia, 3000/mês
- **Pro ($20/mês):** 50k emails/mês

### Quando preciso?
Só se quiser receber notificações por email quando chegar lead novo.

---

## 🎯 PRIORIDADES PARA MVP/DEMO

### ✅ OBRIGATÓRIO (para seed + dashboard):
1. **DATABASE_URL** - Neon.tech (GRÁTIS)

### 🟡 RECOMENDADO (para IA funcionar):
2. **GOOGLE_API_KEY** - Google AI Studio (GRÁTIS, mais fácil)
   OU
3. **OPENAI_API_KEY** - OpenAI (PAGO, mas tem $5 grátis)

### 🔵 OPCIONAL (features extras):
4. **HUNTER_API_KEY** - Hunter.io (GRÁTIS, 25/mês)
5. **RESEND_API_KEY** - Resend (GRÁTIS, 100/dia)

---

## 🚀 PRÓXIMOS PASSOS

### 1. Configure DATABASE_URL:
```bash
# Edite o .env e adicione a URL do Neon
nano .env
```

### 2. Aplique o schema no banco:
```bash
make db-push
```

### 3. Popule com dados fictícios:
```bash
npm run db:seed
```

### 4. Rode o projeto:
```bash
make dev
```

### 5. Acesse o Dashboard:
```
http://localhost:5000/dashboard
```

---

## 📞 SUPORTE

Se tiver dúvidas sobre qualquer serviço:
- **Neon:** https://neon.tech/docs
- **OpenAI:** https://platform.openai.com/docs
- **Google AI:** https://ai.google.dev/docs
- **Hunter:** https://hunter.io/api-documentation
- **Resend:** https://resend.com/docs
