<!-- markdown rules -->

**Última atualização:** 2026-01-16

## Regras de Markdown - NEØ Dev

### Regra Principal: Linha em Branco Após Headers

**SEMPRE adicione uma linha em branco após qualquer título** (###, ##, #) antes de iniciar o conteúdo.

#### ✅ Correto

```markdown
### 1. **Título da Seção** ✅ STATUS

-  **Campo**: Valor
-  **Outro campo**: Outro valor
```

#### ❌ Incorreto

```markdown
### 1. **Título da Seção** ✅ STATUS
-  **Campo**: Valor
-  **Outro campo**: Outro valor
```

### Padrões de Formatação

#### Títulos

-  Use `#` para título principal (H1)
-  Use `##` para seções principais (H2)
-  Use `###` para subseções (H3)
-  Use `####` para sub-subseções (H4)

**Sempre adicione uma linha em branco após o título antes do conteúdo.**

#### Listas

-  Use `-` para listas não ordenadas
-  Use `1.`, `2.`, etc. para listas ordenadas
-  Indente com 2 espaços para subitens
-  **MD030**: Use **2 espaços** após o marcador da lista (não 1)
-  **MD032**: Listas devem ser cercadas por linhas em branco (antes e depois)

##### MD030: Espaçamento Após Marcadores de Lista

**Regra:** O marcador de lista (`-`, `*`, `+` ou `1.`, `2.`, etc.) deve ser seguido por **exatamente 2 espaços** antes do conteúdo.

**Erro comum:** `MD030/list-marker-space: Spaces after list markers [Expected: 2; Actual: 1]`

**Solução:**

1.  **Identificar o erro:** Procure por linhas que começam com `-` (1 espaço) ou `1.` (1 espaço)
2.  **Corrigir:** Adicione um espaço extra após o marcador: `-` (2 espaços) ou `1.` (2 espaços)
3.  **Verificar:** Execute `markdownlint` ou verifique no editor

**Exemplos:**

##### Correto (MD030)

```markdown
-  Item da lista (2 espaços após o `-`)
*  Outro item (2 espaços após o `*`)
1.  Item ordenado (2 espaços após o `1.`)
2.  Segundo item (2 espaços após o `2.`)

  -  Subitem indentado (2 espaços após o `-`)
  *  Outro subitem (2 espaços após o `*`)
```

##### Incorreto (MD030)

```markdown
- Item da lista (1 espaço - ERRADO)
* Outro item (1 espaço - ERRADO)
1. Item ordenado (1 espaço - ERRADO)
2. Segundo item (1 espaço - ERRADO)

  - Subitem indentado (1 espaço - ERRADO)
```

**Correção automática:**

Se estiver usando VS Code com extensão Markdownlint, você pode:

1.  Clicar com botão direito no erro
2.  Selecionar "Fix all auto-fixable problems"
3.  Ou usar: `Ctrl+Shift+P` → "Fix all auto-fixable problems"

**Correção manual:**

Substitua todos os padrões:

-  `-` → `-` (adicionar um espaço)
-  `*` → `*` (adicionar um espaço)
-  `+` → `+` (adicionar um espaço)
-  `1.` → `1.` (adicionar um espaço)
-  `2.` → `2.` (adicionar um espaço)
-  E assim por diante para todos os números

##### ✅ Correto (MD032)

```markdown
Texto antes da lista.

-  Item 1
-  Item 2

Texto depois da lista.
```

##### ❌ Incorreto (MD032)

```markdown
Texto antes da lista.
-  Item 1
-  Item 2
Texto depois da lista.
```

#### Código

-  Use `backticks` para código inline
-  Use blocos de código com ``` para blocos
-  **MD040**: Sempre especifique a linguagem nos blocos de código (obrigatório)

##### ✅ Correto (MD040)

```markdown
```bash
echo "Hello World"
```

```text
Estrutura de diretórios
```

```json
{"key": "value"}
```

```

##### ❌ Incorreto (MD040)

```markdown
```

echo "Hello World"

```

```

Estrutura de diretórios

```
```

#### Ênfase

-  Use `**negrito**` para destaque
-  Use `*itálico*` para ênfase suave
-  Use `~~riscado~~` para texto descontinuado

##### Emojis e Unicode

NUNCA use emojis (😀, ✅, ❌, etc.) em documentação ou código.

Use caracteres Unicode quando necessário para simbolismo visual:

⟁ ⟠ ⧉ ⧇ ⧖ ⧗ ⍟
◬ ◭ ◮ ◯ ⨀ ⨂ ⨷
◱ ◲ ◳ ◴ ◵ ◶ ◷ ⦿ ꙮ

##### Resumo de Erros Comuns e Soluções

**MD030 - Espaçamento após marcadores de lista**

-  **Erro:** `MD030/list-marker-space: Spaces after list markers [Expected: 2; Actual: 1]`
-  **Causa:** Marcador de lista seguido por apenas 1 espaço em vez de 2
-  **Solução:** Adicione um espaço extra após o marcador (`-` → `-`)
-  **Exemplo de correção:**

  ```markdown
  # Antes (ERRADO)
  - Item 1
  - Item 2
  
  # Depois (CORRETO)
  -  Item 1
  -  Item 2
  ```

-  **Ferramentas:** Use `markdownlint --fix` ou extensão do VS Code para correção automática

### Configurações do Projeto

Este projeto usa:

-  **EditorConfig** (`.editorconfig`) - Configurações do editor
-  **Prettier** (`.prettierrc.json`) - Formatação automática
-  **Markdownlint** (`.markdownlint.json`) - Validação de estilo

Ver `.markdown-style-guide.md` para guia completo.

---

## Referência Rápida: MD030

**Regra:** Marcadores de lista devem ter exatamente 2 espaços após eles.

**Padrão configurado em `.markdownlint.json`:**

```json
"MD030": {
  "ul_single": 2,
  "ol_single": 2,
  "ul_multi": 2,
  "ol_multi": 2
}
```

**Isso significa:**

-  Listas não ordenadas (`-`, `*`, `+`): 2 espaços após o marcador
-  Listas ordenadas (`1.`, `2.`, etc.): 2 espaços após o número e ponto
-  Aplica-se tanto para listas simples quanto aninhadas

**Exemplo prático:**

```markdown
# Correto
-  Primeiro item
-  Segundo item
  1.  Subitem ordenado
  2.  Outro subitem
-  Terceiro item

# Incorreto (gera erro MD030)
- Primeiro item
- Segundo item
  1. Subitem ordenado
  2. Outro subitem
- Terceiro item
```

---

**Author:** MELLØ // NEØ DEV

This project follows NEØ development standards.
Security is a priority, not an afterthought.
