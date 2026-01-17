# 📁 ATTACHED ASSETS - PUNK | BLVCK

**Alias Vite:** `@assets` → `./attached_assets/`

## 🎯 PROPÓSITO

Pasta reservada para **recursos externos/anexados** do projeto PUNK | BLVCK.

## 🔧 USO

```typescript
// Importação via alias do Vite
import logo from '@assets/logo.png';
import video from '@assets/demo.mp4';
import documento from '@assets/manual.pdf';
```

## 📋 DIRETRIZES

-  **Imagens:** Logos, ícones, backgrounds externos
-  **Vídeos:** Demos, tutoriais, conteúdo promocional
-  **Documentos:** PDFs, manuais, especificações
-  **Assets temporários:** Recursos de desenvolvimento/conceito

## 🚨 IMPORTANTE

-  Pasta atualmente **vazia** (pronta para uso futuro)
-  Alias configurado no `vite.config.ts`
-  **Não commitar** arquivos grandes (>10MB)
-  Usar apenas para recursos **externos** ao código principal

## 📚 EXEMPLO DE USO FUTURO

```text
attached_assets/
├── logos/
│   ├── punk-blvck-logo.svg
│   └── partner-logos/
├── videos/
│   ├── hero-background.mp4
│   └── tutorial.webm
└── docs/
    ├── brand-guidelines.pdf
    └── technical-specs.md
```

---

**Criado em:** 17/01/2026

**Status:** Reservado para uso futuro

**Arquitetura:** NEØ Protected
