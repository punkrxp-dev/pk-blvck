# 🎸 MCP Orchestrator - Heavy Metal Flow

**Model Context Protocol** implementation for robust lead processing with AI classification and automatic fallback.

---

## 🎯 Overview

The MCP Orchestrator implements a **4-step pipeline** for processing leads with maximum reliability:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   ENRICH    │ -> │   CLASSIFY   │ -> │    SAVE     │ -> │   NOTIFY     │
│  (Hunter)   │    │  (AI/Rules)  │    │  (Database) │    │   (Resend)   │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### Key Features

- ✅ **Dual AI Model Support**: GPT-4o primary, Gemini fallback
- ✅ **Automatic Fallback**: If GPT fails, Gemini takes over instantly
- ✅ **Rule-Based Backup**: If both AIs fail, uses intelligent rules
- ✅ **Mock Mode**: Works without API keys for development
- ✅ **Full Observability**: Detailed logging at every step

---

## 📁 Architecture

```
server/ai/
├── orchestrator.ts    # Main Heavy Metal Flow logic
├── tools.ts           # Hunter, Database, Resend integrations
├── models.ts          # AI model configurations
└── README.md          # AI models documentation
```

---

## 🚀 Quick Start

### 1. API Endpoint

```bash
POST /api/mcp/ingest
Content-Type: application/json

{
  "email": "lead@example.com",
  "message": "I want to buy your product",
  "source": "website-contact-form"
}
```

### 2. Response

```json
{
  "success": true,
  "message": "Lead processed successfully",
  "data": {
    "id": "uuid-here",
    "email": "lead@example.com",
    "intent": "high",
    "confidence": 0.92,
    "reasoning": "Clear buying intent with specific inquiry",
    "model": "gpt-4o",
    "enrichedData": {
      "firstName": "John",
      "lastName": "Doe",
      "company": "TechCorp",
      "position": "CEO",
      "verified": true
    },
    "notified": true,
    "processingTime": 1234
  }
}
```

---

## 🔧 Configuration

### Required Environment Variables

```bash
# AI Models (at least one required)
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=...

# Database (required)
DATABASE_URL=postgresql://...

# Tools (optional - uses mocks if not set)
HUNTER_API_KEY=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@yourdomain.com
NOTIFICATION_EMAIL=admin@yourdomain.com
```

### Mock Mode

If API keys are not configured, the system automatically uses mock data:

- **Hunter.io**: Generates realistic fake enriched data
- **Resend**: Logs notifications to console
- **AI**: Falls back to rule-based classification if both models fail

---

## 🎸 The Heavy Metal Flow

### Step 1: Enrich Lead

```typescript
const enrichedData = await enrichLead(email);
// Returns: { firstName, lastName, company, position, ... }
```

**Data Source**: Hunter.io API or mock data  
**Fallback**: Always returns data (mock if API fails)

### Step 2: Classify Intent (CRITICAL)

```typescript
const classification = await classifyIntentWithFallback(input, enrichedData);
// Returns: { intent, confidence, reasoning, model }
```

**Primary**: GPT-4o via Vercel AI SDK  
**Fallback**: Gemini 2.0 Flash  
**Last Resort**: Rule-based classification

**Intent Levels**:
- `high`: Ready to buy, clear intent
- `medium`: Interested, needs nurturing
- `low`: Just browsing
- `spam`: Suspicious or invalid

### Step 3: Save to Database

```typescript
const savedLead = await saveLead({ email, enrichedData, aiClassification, ... });
// Returns: Lead record with ID
```

**Features**:
- Upsert logic (updates existing leads)
- JSONB columns for flexible data storage
- Automatic timestamps

### Step 4: Send Notification

```typescript
const notified = await notifyLead(email, intent);
// Returns: true if sent, false if logged
```

**Behavior**:
- High intent → Immediate alert email
- Medium/Low → Standard notification
- Spam → Admin review notification

---

## 🧪 Testing

### Test Script

```bash
# Test the entire flow
tsx server/test-mcp.ts
```

### Manual API Test

```bash
# Using curl
curl -X POST http://localhost:5000/api/mcp/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "message": "I want pricing info",
    "source": "api-test"
  }'

# Health check
curl http://localhost:5000/api/mcp/health
```

---

## 📊 Database Schema

### Leads Table

```sql
CREATE TABLE leads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  raw_message TEXT,
  source TEXT NOT NULL,
  
  -- JSONB columns for flexibility
  enriched_data JSONB,
  ai_classification JSONB,
  
  status TEXT NOT NULL DEFAULT 'pending',
  notified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Apply Schema

```bash
# Push schema to database
npm run db:push

# Or via Makefile
make db-push
```

---

## 🛡️ Error Handling

### AI Model Fallback Chain

```
1. Try GPT-4o
   ↓ (if fails)
2. Try Gemini
   ↓ (if fails)
3. Use rule-based classification
```

### Error Scenarios

| Scenario | Behavior |
|----------|----------|
| GPT-4o fails | Automatic Gemini fallback |
| Both AIs fail | Rule-based classification |
| Hunter.io fails | Mock enriched data |
| Resend fails | Console log notification |
| Database fails | Error thrown, lead saved as 'failed' |

---

## 📈 Performance

Typical processing times:

- **With AI**: 1-3 seconds
- **Mock mode**: < 500ms
- **Database save**: < 100ms

---

## 🔍 Monitoring

### Logs

The orchestrator provides detailed logging:

```
🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎸 HEAVY METAL FLOW - Lead Processing Started
🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: lead@example.com
📝 Message: I want to buy
📍 Source: website

⚡ STEP 1: Enriching lead data...
✅ Enriched: John Doe @ TechCorp

⚡ STEP 2: Classifying intent with AI...
🤖 Attempting classification with GPT-4o...
✅ Intent: HIGH (92% confidence)
💭 Reasoning: Clear buying intent
🤖 Model: gpt-4o

⚡ STEP 3: Saving lead to database...
✅ Saved to database: uuid-here

⚡ STEP 4: Sending notification...
✅ Notification sent

🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 HEAVY METAL FLOW - Completed in 1234ms
🎸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Health Check

```bash
GET /api/mcp/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-01-12T20:00:00Z",
  "ai": {
    "openai": "configured",
    "google": "configured",
    "hasAnyModel": true
  },
  "database": {
    "connected": true
  }
}
```

---

## 🚀 Production Checklist

- [ ] Configure `OPENAI_API_KEY` or `GOOGLE_API_KEY`
- [ ] Set up Neon Postgres (`DATABASE_URL`)
- [ ] Apply database schema (`npm run db:push`)
- [ ] Configure `HUNTER_API_KEY` (optional)
- [ ] Configure `RESEND_API_KEY` (optional)
- [ ] Set `NOTIFICATION_EMAIL` for alerts
- [ ] Test with `tsx server/test-mcp.ts`
- [ ] Monitor logs for errors
- [ ] Set up database backups

---

## 📚 API Reference

### POST /api/mcp/ingest

Ingest and process a new lead.

**Request Body:**
```typescript
{
  email: string;        // Required, valid email
  message?: string;     // Optional, lead message
  source: string;       // Required, e.g. "website", "api"
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    intent: 'high' | 'medium' | 'low' | 'spam';
    confidence: number;
    reasoning: string;
    model: 'gpt-4o' | 'gemini-2.0-flash';
    enrichedData: object;
    notified: boolean;
    processingTime: number;
  };
  error?: string;
}
```

### GET /api/mcp/health

Check MCP system health.

**Response:**
```typescript
{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  ai: {
    openai: 'configured' | 'not configured';
    google: 'configured' | 'not configured';
    hasAnyModel: boolean;
  };
  database: {
    connected: boolean;
  };
}
```

---

## 🎯 Next Steps

1. **Configure API Keys**: Add your OpenAI/Google keys to `.env`
2. **Test Locally**: Run `tsx server/test-mcp.ts`
3. **Deploy Database**: Set up Neon Postgres
4. **Monitor Performance**: Check logs and health endpoint
5. **Scale**: Add rate limiting, caching, webhooks

---

**Built with ❤️ and Heavy Metal 🎸**
