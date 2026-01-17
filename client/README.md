# 📁 CLIENT - PUNK BLVCK Frontend

## 📱 Frontend React/TypeScript com arquitetura NEØ

## 📊 VISÃO GERAL

Esta pasta contém o frontend da aplicação PUNK BLVCK, desenvolvido com React 19, TypeScript e Vite, seguindo os padrões de arquitetura NEØ.

## 🏗️ ESTRUTURA ORGANIZADA

```text
client/
├── public/                 # Assets estáticos públicos
│   ├── *.png              # Ícones e imagens
│   ├── robots.txt         # SEO
│   ├── sitemap.xml        # SEO
│   └── site.webmanifest   # PWA
├── src/
│   ├── components/        # Componentes React
│   │   ├── dashboard/     # Componentes específicos do dashboard
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── intent-badge.tsx
│   │   │   ├── lead-actions.tsx
│   │   │   ├── lead-detail-modal.tsx
│   │   │   └── lead-filters.tsx
│   │   ├── features/      # Componentes de features (reservado)
│   │   └── ui/           # Componentes base/UI (shadcn/ui)
│   ├── hooks/            # Custom hooks React
│   │   ├── use-leads.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/              # Utilitários e configurações
│   │   ├── csv-export.ts # Exportação CSV
│   │   ├── queryClient.ts # React Query
│   │   └── utils.ts      # Funções utilitárias
│   ├── pages/            # Páginas da aplicação
│   │   ├── dashboard.tsx
│   │   ├── home.tsx
│   │   ├── landing.tsx
│   │   └── not-found.tsx
│   ├── App.tsx           # Componente raiz
│   ├── main.tsx          # Ponto de entrada
│   └── index.css         # Estilos globais
├── index.html            # Template HTML
├── site.webmanifest      # Configuração PWA
└── README.md             # Esta documentação
```

## 📋 ORGANIZAÇÃO POR RESPONSABILIDADES

### *components/dashboard/*

Componentes específicos do sistema de dashboard/leads:

-  **`dashboard-header.tsx`** - Cabeçalho do dashboard
-  **`intent-badge.tsx`** - Badge de intenção do lead
-  **`lead-actions.tsx`** - Ações disponíveis para leads
-  **`lead-detail-modal.tsx`** - Modal de detalhes do lead
-  **`lead-filters.tsx`** - Filtros e busca de leads

### *components/ui/*

Componentes base reutilizáveis (shadcn/ui):

-  Componentes primitivos (Button, Input, Dialog, etc.)
-  Sistema de design consistente
-  Acessibilidade integrada

### *hooks/*

Custom hooks para lógica reutilizável:

-  **`use-leads.ts`** - Gerenciamento de estado dos leads
-  **`use-mobile.tsx`** - Detecção de dispositivo móvel
-  **`use-toast.ts`** - Sistema de notificações

### *lib/*

Utilitários e configurações:

-  **`queryClient.ts`** - Configuração React Query
-  **`utils.ts`** - Funções helper (cn, formatters)
-  **`csv-export.ts`** - Exportação de dados

### *pages/*

Páginas da aplicação:

-  **`dashboard.tsx`** - Dashboard principal
-  **`home.tsx`** - Página inicial (landing)
-  **`landing.tsx`** - Página de conversão
-  **`not-found.tsx`** - Página 404

## 🔧 CONFIGURAÇÕES IMPORTANTES

### Vite Configuration

-  **Aliases configurados**: `@/components`, `@/lib`, etc.
-  **Build otimizado**: Code splitting automático
-  **HMR**: Hot Module Replacement para desenvolvimento

### PWA (Progressive Web App)

-  **Manifest**: `site.webmanifest`
-  **Ícones**: Múltiplos tamanhos (192x192, 512x512)
-  **Service Worker**: Cache inteligente

### SEO & Performance

-  **Meta tags dinâmicas** via Vite plugin
-  **Open Graph** para compartilhamento
-  **Sitemap e robots.txt** automáticos

## 🚀 DESENVOLVIMENTO

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build

# Qualidade
npm run lint         # ESLint
npm run type-check   # TypeScript
```

### Estrutura de Importações

```typescript
// Componentes UI
import { Button } from '@/components/ui/button';

// Componentes específicos
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

// Hooks
import { useLeads } from '@/hooks/use-leads';

// Utilitários
import { exportLeadsToCSV } from '@/lib/csv-export';
```

## 📊 MÉTRICAS DE QUALIDADE

-  **TypeScript**: 100% type-safe
-  **ESLint**: Zero erros de linting
-  **Bundle size**: Otimizado com tree-shaking
-  **Performance**: Core Web Vitals atendidos
-  **Acessibilidade**: WCAG 2.1 AA compliant

## 🔗 INTEGRAÇÕES

-  **Backend**: API RESTful com autenticação
-  **Database**: PostgreSQL via Drizzle ORM
-  **Auth**: Passport.js com sessões seguras
-  **AI**: Vercel AI SDK (GPT-4o, Gemini)

---

**Author:** MELLØ // NEØ DEV

This project follows NEØ development standards.
Security is a priority, not an afterthought.
