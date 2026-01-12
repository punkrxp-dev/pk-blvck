# 🎸 Dashboard Punk Black - Guia de Uso

**Dashboard de monitoramento de leads em tempo real com estética Punk Black**

---

## 🎯 Acesso

```
URL: http://localhost:5000/dashboard
```

Ou clique em **"🎸 dashboard"** no menu principal.

---

## 📊 Visão Geral

O Dashboard fornece uma visão completa e em tempo real de todos os leads processados pelo MCP Orchestrator.

### Features Principais:

- ✅ **Auto-refresh a cada 5 segundos** (polling)
- ✅ **KPIs em tempo real**
- ✅ **Tabela de leads com filtros**
- ✅ **Badges coloridos por intenção**
- ✅ **Estética Punk Black** (dark + neon orange)

---

## 🎨 Estética Punk Black

### Cores:
- **Background:** `bg-zinc-950` (quase preto)
- **Cards:** `bg-zinc-900/50` (semi-transparente)
- **Accent:** `text-orange-500` (neon laranja)
- **Borders:** Finas e sutis com glow

### Intent Colors:
- 🔥 **High:** Orange (neon)
- 📊 **Medium:** Blue
- 📝 **Low:** Gray
- 🚫 **Spam:** Red

---

## 📈 KPI Cards

### 1. Total de Leads
- **Ícone:** 📊
- **Cor:** Blue
- **Descrição:** Número total de leads no sistema

### 2. Alta Intenção
- **Ícone:** 🔥
- **Cor:** Orange (neon)
- **Descrição:** Leads classificados como "high intent"
- **Ação:** Prioridade máxima para follow-up

### 3. Processados Hoje
- **Ícone:** ✅
- **Cor:** Green
- **Descrição:** Leads processados nas últimas 24h

### 4. Spam Detectado
- **Ícone:** 🚫
- **Cor:** Red
- **Descrição:** Leads marcados como spam pela IA

---

## 📋 Tabela de Leads

### Colunas:

#### Email
- Email do lead
- ✓ Badge verde se verificado pelo Hunter.io
- Nome completo abaixo (se disponível)

#### Empresa
- Nome da empresa do enrichment
- "-" se não disponível

#### Cargo
- Posição do lead na empresa
- "-" se não disponível

#### Intenção
- Badge colorido com classificação da IA
- Mostra % de confiança
- **Cores:**
  - 🔥 Alta (orange)
  - 📊 Média (blue)
  - 📝 Baixa (gray)
  - 🚫 Spam (red)

#### Status
- Estado atual do lead
- **Valores:**
  - `processed` (verde)
  - `pending` (amarelo)
  - `failed` (vermelho)

#### Data
- Timestamp de criação
- Formato: DD/MM HH:MM

---

## 🔄 Auto-Refresh

### Indicador "Ao Vivo"

No canto superior direito:
- 🟢 **Verde:** Dados atualizados
- 🟠 **Laranja pulsando:** Atualizando...

### Configuração:

```typescript
// Em use-leads.ts
refetchInterval: 5000  // 5 segundos
```

Para alterar o intervalo, edite o hook `useLeads`.

---

## 🎯 Como Usar

### 1. Monitoramento Básico

Simplesmente abra o dashboard e observe:
- Novos leads aparecem automaticamente
- KPIs atualizam em tempo real
- Tabela se atualiza a cada 5 segundos

### 2. Identificar Leads Quentes

Procure por:
- 🔥 Badge **"Alta"** (orange)
- ✓ Email verificado
- Cargo sênior (CEO, CTO, Founder)
- Empresa conhecida

### 3. Priorizar Follow-up

**Alta prioridade:**
- Intent: High
- Confidence: > 80%
- Email verificado
- Status: processed

**Média prioridade:**
- Intent: Medium
- Confidence: 60-80%

**Baixa prioridade:**
- Intent: Low
- Spam: Ignorar

---

## 🔍 Filtros (API)

Embora a UI não tenha filtros visuais ainda, você pode filtrar via URL:

```bash
# Apenas leads de alta intenção
/dashboard?intent=high

# Apenas processados
/dashboard?status=processed

# Limitar quantidade
/dashboard?limit=20
```

---

## 🛠️ Customização

### Alterar Intervalo de Refresh

```typescript
// client/src/hooks/use-leads.ts
export function useLeads(options: UseLeadsOptions = {}) {
  const { refetchInterval = 5000, ...filterOptions } = options;
  // Altere 5000 para o valor desejado em ms
}
```

### Adicionar Filtros na UI

Exemplo de filtro por intenção:

```typescript
const [intentFilter, setIntentFilter] = useState<string | undefined>();

const { data } = useLeads({ intent: intentFilter });

// Adicione botões:
<button onClick={() => setIntentFilter('high')}>
  Alta Intenção
</button>
```

### Customizar Cores

Edite as classes Tailwind em `dashboard.tsx`:

```typescript
// Trocar accent de orange para purple:
'text-orange-500' → 'text-purple-500'
'border-orange-500' → 'border-purple-500'
```

---

## 📊 Estatísticas

### Distribuição de Intenção

Seção mostra breakdown visual:
- Quantos leads em cada categoria
- Atualiza em tempo real
- Ajuda a entender padrões

### Cálculo:

```typescript
stats = {
  total: allLeads.length,
  high: filter(intent === 'high'),
  medium: filter(intent === 'medium'),
  low: filter(intent === 'low'),
  spam: filter(intent === 'spam'),
  processedToday: filter(createdAt >= today)
}
```

---

## 🚨 Troubleshooting

### Dashboard não carrega

1. Verifique se o servidor está rodando:
   ```bash
   make dev
   ```

2. Verifique o endpoint:
   ```bash
   curl http://localhost:5000/api/mcp/leads
   ```

3. Veja o console do navegador (F12)

### Dados não atualizam

1. Verifique o indicador "Ao vivo"
2. Veja o Network tab (F12)
3. Confirme que há leads no banco:
   ```bash
   tsx server/test-mcp.ts
   ```

### Tabela vazia

1. Crie leads de teste:
   ```bash
   curl -X POST http://localhost:5000/api/mcp/ingest \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "message": "Interested in your product",
       "source": "dashboard-test"
     }'
   ```

2. Aguarde 5 segundos para refresh

---

## 🎨 Screenshots (Descrição)

### Header
- Título "🎸 Dashboard Heavy Metal"
- Indicador "Ao vivo" no canto
- Background escuro com gradiente sutil

### KPI Cards
- Grid responsivo (1-4 colunas)
- Cards com border glow
- Ícones grandes
- Números em destaque

### Tabela
- Header fixo com labels uppercase
- Linhas com hover effect
- Badges coloridos
- Scroll horizontal em mobile

---

## 🚀 Próximas Features

- [ ] Filtros visuais (dropdowns)
- [ ] Ordenação de colunas
- [ ] Paginação
- [ ] Exportar para CSV
- [ ] Gráficos de tendência
- [ ] Notificações push
- [ ] Detalhes do lead (modal)
- [ ] Ações rápidas (marcar como spam, etc)

---

## 📚 Referências

- **Hook:** `client/src/hooks/use-leads.ts`
- **Page:** `client/src/pages/dashboard.tsx`
- **API:** `server/routes.ts` (GET /api/mcp/leads)
- **Docs:** `docs/mcp-orchestrator.md`

---

**Built with 🎸 and Punk Black aesthetic**
