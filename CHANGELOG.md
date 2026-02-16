# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.5.1] - 2026-02-16

### Alterado

- Projeto renomeado de **OpenSheets** para **OpenMonetis** em todo o codebase (~40 arquivos): package.json, manifests, layouts, componentes, server actions, emails, Docker, docs e landing page
- URLs do repositório atualizados de `opensheets-app` para `openmonetis`
- Docker image renomeada para `felipegcoutinho/openmonetis`
- Logo textual atualizado (`logo_text.png`)

### Adicionado

- Suporte a multi-domínio via `PUBLIC_DOMAIN`: domínio público serve apenas a landing page (sem botões de login/cadastro, rotas do app bloqueadas pelo middleware)
- Variável de ambiente `PUBLIC_DOMAIN` no `.env.example` com documentação

## [1.5.0] - 2026-02-15

### Adicionado

- Customização de fontes nas preferências — fonte da interface e fonte de valores monetários configuráveis por usuário
- 13 fontes disponíveis: AI Sans, Anthropic Sans, SF Pro Display, SF Pro Rounded, Inter, Geist Sans, Roboto, Reddit Sans, Fira Sans, Ubuntu, JetBrains Mono, Fira Code, IBM Plex Mono
- FontProvider com preview ao vivo — troca de fonte aplica instantaneamente via CSS variables, sem necessidade de reload
- Fontes Apple SF Pro (Display e Rounded) carregadas localmente com 4 pesos (Regular, Medium, Semibold, Bold)
- Colunas `system_font` e `money_font` na tabela `preferencias_usuario`

### Corrigido

- Cores de variação invertidas na tabela de receitas em `/relatorios/tendencias` — aumento agora é verde (bom) e diminuição é vermelho (ruim), consistente com a semântica de receita

### Alterado

- Sistema de fontes migrado de className direto para CSS custom properties (`--font-app`, `--font-money`) via `@theme inline`
- MoneyValues usa `var(--font-money)` em vez de classe fixa, permitindo customização

## [1.4.1] - 2026-02-15

### Adicionado

- Abas "Pendentes", "Processados" e "Descartados" na página de pré-lançamentos (antes exibia apenas pendentes)
- Logo do cartão/conta exibido automaticamente nos cards de pré-lançamento via matching por nome do app
- Pre-fill automático do cartão de crédito ao processar pré-lançamento (match pelo nome do app)
- Badge de status e data nos cards de itens já processados/descartados (modo readonly)

### Corrigido

- `revalidateTag("dashboard", "max")` para invalidar todas as entradas de cache da tag (antes invalidava apenas a mais recente)
- Cor `--warning` ajustada para melhor contraste (mais alaranjada)
- `EstabelecimentoLogo` não precisava de `"use client"` — removido
- Fallback no cálculo de `fontSize` em `EstabelecimentoLogo`

### Alterado

- Nome do estabelecimento formatado em Title Case ao processar pré-lançamento
- Subtítulo da página de pré-lançamentos atualizado

## [1.4.0] - 2026-02-07

### Corrigido

- Widgets de boleto/fatura não atualizavam após pagamento: actions de fatura (`updateInvoicePaymentStatusAction`, `updatePaymentDateAction`) e antecipação de parcelas não invalidavam o cache do dashboard
- Substituídos `revalidatePath()` manuais por `revalidateForEntity()` nas actions de fatura e antecipação
- Expandido `revalidateConfig.cartoes` para incluir `/contas` e `/lancamentos` (afetados por pagamento de fatura)
- Scroll não funcionava em listas Popover+Command (estabelecimento, categorias, filtros): adicionado `modal` ao Popover nos 4 componentes afetados

### Adicionado

- Link "detalhes" no card de orçamento para navegar diretamente à página da categoria
- Indicadores de tendência coloridos nos cards de métricas do dashboard (receitas, despesas, balanço, previsto) com cores semânticas sutis
- Tokens semânticos de estado no design system: `--success`, `--warning`, `--info` (com foregrounds) para light e dark mode
- Cores de chart estendidas de 6 para 10 (`--chart-7` a `--chart-10`: teal, violet, cyan, lime)
- Variantes `success` e `info` no componente Badge

### Alterado

- Migrados ~60+ componentes de cores hardcoded do Tailwind (`green-500`, `red-600`, `amber-500`, `blue-500`, etc.) para tokens semânticos (`success`, `destructive`, `warning`, `info`)
- Unificados 3 arrays duplicados de cores de categorias (em `category-report-chart.tsx`, `category-history.ts`, `category-history-widget.tsx`) para importação única de `category-colors.ts`
- Month picker migrado de tokens customizados (`--month-picker`) para tokens padrão (`--card`)
- Dark mode normalizado: hues consistentes (~70 warm family) em vez de valores dispersos
- Token `--accent` ajustado para ser visualmente distinto de `--background`
- Token `--card` corrigido para branco limpo (`oklch(100% 0 0)`)

### Removido

- Tokens não utilizados: `--dark`, `--dark-foreground`, `--month-picker`, `--month-picker-foreground`

## [1.3.1] - 2026-02-06

### Adicionado

- Calculadora arrastável via drag handle no header do dialog
- Callback `onSelectValue` na calculadora para inserir valor diretamente no campo de lançamento
- Aba "Changelog" em Ajustes com histórico de versões parseado do CHANGELOG.md

### Alterado

- Unificadas páginas de itens ativos e arquivados em Cartões, Contas e Anotações com sistema de tabs (padrão Categorias)
- Removidas rotas separadas `/cartoes/inativos`, `/contas/inativos` e `/anotacoes/arquivadas`
- Removidos sub-links de inativos/arquivados da sidebar
- Padronizada nomenclatura para "Arquivados"/"Arquivadas" em todas as entidades

## [1.3.0] - 2026-02-06

### Adicionado

- Indexes compostos em `lancamentos`: `(userId, period, transactionType)` e `(pagadorId, period)`
- Cache cross-request no dashboard via `unstable_cache` com tag `"dashboard"` e TTL de 120s
- Invalidação automática do cache do dashboard via `revalidateTag("dashboard")` em mutations financeiras
- Helper `getAdminPagadorId()` com `React.cache()` para lookup cacheado do admin pagador

### Alterado

- Eliminados ~20 JOINs com tabela `pagadores` nos fetchers do dashboard (substituídos por filtro direto com `pagadorId`)
- Consolidadas queries de income-expense-balance: 12 queries → 1 (GROUP BY period + transactionType)
- Consolidadas queries de payment-status: 2 queries → 1 (GROUP BY transactionType)
- Consolidadas queries de expenses/income-by-category: 4 queries → 2 (GROUP BY categoriaId + period)
- Scan de métricas limitado a 24 meses ao invés de histórico completo
- Auth session deduplicada por request via `React.cache()`
- Widgets de dashboard ajustados para aceitar `Date | string` (compatibilidade com serialização do `unstable_cache`)
- `CLAUDE.md` otimizado de ~1339 linhas para ~140 linhas

## [1.2.6] - 2025-02-04

### Alterado

- Refatoração para otimização do React 19 compiler
- Removidos `useCallback` e `useMemo` desnecessários (~60 instâncias)
- Removidos `React.memo` wrappers desnecessários
- Simplificados padrões de hidratação com `useSyncExternalStore`

### Arquivos modificados

- `hooks/use-calculator-state.ts`
- `hooks/use-form-state.ts`
- `hooks/use-month-period.ts`
- `components/auth/signup-form.tsx`
- `components/contas/accounts-page.tsx`
- `components/contas/transfer-dialog.tsx`
- `components/lancamentos/table/lancamentos-filters.tsx`
- `components/sidebar/nav-main.tsx`
- `components/month-picker/nav-button.tsx`
- `components/month-picker/return-button.tsx`
- `components/privacy-provider.tsx`
- `components/dashboard/category-history-widget.tsx`
- `components/anotacoes/note-dialog.tsx`
- `components/categorias/category-dialog.tsx`
- `components/confirm-action-dialog.tsx`
- `components/orcamentos/budget-dialog.tsx`

## [1.2.5] - 2025-02-01

### Adicionado

- Widget de pagadores no dashboard
- Avatares atualizados para pagadores

## [1.2.4] - 2025-01-22

### Corrigido

- Preservar formatação nas anotações
- Layout do card de anotações

## [1.2.3] - 2025-01-22

### Adicionado

- Versão exibida na sidebar
- Documentação atualizada

## [1.2.2] - 2025-01-22

### Alterado

- Atualização de dependências
- Aplicada formatação no código
