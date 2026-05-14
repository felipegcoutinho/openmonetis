# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [2.5.7] - 2026-05-14

Esta versão faz um polimento visual no relatório de análise de parcelas, deixando o estabelecimento como referência principal do card e mantendo o cartão visível de forma mais discreta no contexto da compra.

### Alterado
- Relatórios: em `/reports/installment-analysis`, os cards de parcelas passam a usar o logo do estabelecimento como avatar principal; o logo do cartão agora aparece menor ao lado do nome do cartão, tanto no card quanto no modal de detalhes.
- Relatórios: a página de análise de parcelas pré-carrega os mapeamentos de logos de estabelecimentos para evitar troca visual após o primeiro render.
- Lançamentos: o campo de anexos no modal agora aceita arquivos colados com `Ctrl+V`, mantendo o botão para buscar arquivos normalmente.
- Lançamentos: o modal agora usa uma única área interna de rolagem, com cabeçalho e rodapé estáveis, reduzindo travadas ao rolar e ao abrir "Condições, anotações e anexos".
- Anotações: tarefas agora podem ser editadas inline no modal "Atualizar anotação"; clicar no texto abre o input e o botão de remover vira botão de salvar naquela linha.

### Corrigido
- Relatórios: o join com cartões na análise de parcelas agora também valida `cards.userId`, mantendo o filtro de ownership explícito na consulta.

## [2.5.6] - 2026-05-07

Esta versão entrega um conjunto de melhorias em torno do fluxo de lançamentos: filtros mais úteis, divisão por porcentagem, indicador de orçamento dentro do modal e correção de um bug em totais por pessoa que considerava contas excluídas do saldo. Também inclui ajustes de robustez no display da calculadora (sem mais overflow do modal com valores longos) e o fix do cache de RSC nos filtros multi-seleção.

### Adicionado
- Lançamentos: filtro por faixa de valor (mín/máx) com debounce e persistência via query string (`amountMin`/`amountMax`).
- Lançamentos: botão "Limpar" discreto ao lado do botão "Filtros", visível apenas quando há filtros ativos.
- Modal de lançamento: toggle compacto R$/% no card "Dividir lançamento", permitindo distribuir o valor por porcentagem entre as pessoas. Cada input em modo % exibe o valor convertido em R$ logo abaixo, no mesmo padrão visual do `InlinePeriodPicker`.
- Modal de lançamento: indicador de orçamento ao lado do nome da categoria selecionada, mostrando `R$ gasto de R$ orçado (%)` com cores semânticas (verde / âmbar / vermelho) conforme o consumo. Suprimido quando o input divide a linha com o tipo de transação (caso pré-lançamentos). Implementado via `getCategoryBudgetSummaryAction` e `fetchCategoryBudgetSummary` em `features/budgets`.

### Alterado
- Calculadora: display com tamanho de fonte adaptativo (de `text-3xl` a `text-sm`) conforme o comprimento da expressão, mais `truncate` funcional via `min-w-0` nos containers flex. Resolve o overflow do modal com valores muito longos (ex: `9.999.999.999 × 9.999.999.999`).

### Corrigido
- Pessoas: "Totais do mês" em `/payers/[id]` deixa de somar lançamentos vinculados a contas marcadas como `excludeFromBalance` (ex: "Ajuste de saldo"). Adicionado `excludeTransactionsFromExcludedAccounts()` em 6 queries de `src/shared/lib/payers/details.ts`.
- Orçamentos: `fetchBudgetsForUser` e `fetchCategoryBudgetSummary` agora respeitam o filtro de contas excluídas do saldo, alinhando o gasto exibido na tela de Orçamentos com o badge de orçamento dentro do modal de lançamento.
- Lançamentos: tabela de resultados agora reflete corretamente a remoção de um valor em filtros multi-seleção (Pessoa, Conta/Cartão, Categoria, Condição, Forma de Pagamento). Adicionado `router.refresh()` em `handleMultiFilterChange` para invalidar o cache de segmento do router (issue #54).

### Dependências
- Stack core: `next` 16.2.4 → 16.2.6, `react`/`react-dom` 19.2.5 → 19.2.6.
- UI: `react-day-picker` 9 → 10 (major), `tailwindcss` / `@tailwindcss/postcss` 4.2.4 → 4.3.0, `tailwind-merge` 3.5.0 → 3.6.0.
- Auth: `better-auth` 1.6.9 → 1.6.10 e `@better-auth/passkey` 1.6.9 → 1.6.10.
- AI SDKs: `@ai-sdk/anthropic` 3.0.74 → 3.0.76, `@ai-sdk/google` 3.0.67 → 3.0.71, `@ai-sdk/openai` 3.0.60 → 3.0.63, `ai` 6.0.175 → 6.0.177.
- AWS: `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner` 3.1042.0 → 3.1045.0.
- E-mail: `resend` 6.12.2 → 6.12.3.
- Dev tooling: `@biomejs/biome` 2.4.14 → 2.4.15, `knip` 6.11.0 → 6.12.2, `@types/node` 25.6.0 → 25.6.2.

## [2.5.5] - 2026-05-06

Esta versão melhora a navegação por históricos e lançamentos. O changelog ganhou uma linha do tempo mais leve, colapsável e fácil de escanear; os filtros de lançamentos passam a aceitar múltiplas pessoas, categorias, formas de pagamento, condições e contas/cartões na mesma busca; e os diálogos adotam as animações compartilhadas do design system. Também há pequenos polimentos de texto e layout para deixar a interface mais consistente.

### Adicionado
- Lançamentos: filtros multi-seleção para condição, forma de pagamento, pessoa, categoria e conta/cartão, permitindo combinar vários valores no mesmo filtro (query string passa a aceitar múltiplos valores por chave).
- Changelog: parser passou a inferir o tipo de bump (major/minor/patch) a partir da numeração e a extrair o parágrafo de resumo abaixo do cabeçalho de versão; novo arquivo `src/features/settings/lib/changelog-types.ts` consolidando os tipos compartilhados.
- UI: dependência `tw-animate-css` para usar as mesmas animações utilitárias já presentes nos componentes shadcn/ui.

### Alterado
- Changelog: visual da página reformulado para linha do tempo com resumo sempre visível, detalhes colapsáveis por versão, agrupamento por mês e marcadores visuais por tipo de bump; componente migrado para `"use client"` com `Collapsible` e abertura via âncora (`#vX-Y-Z`).
- Lançamentos: botões "Nova Receita" e "Nova Despesa" agora usam os próprios triggers do `TransactionDialog` (via prop `createSlot`), reduzindo estado manual na página e eliminando o fluxo `setCreateOpen` + `transactionTypeForCreate`.
- Diálogos: animações customizadas em CSS (`@keyframes dialog-in/out` e `overlay-in/out`) substituídas pelas classes utilitárias compartilhadas em `Dialog`/`DialogOverlay` (`data-[state=open]:animate-in`, `zoom-in-95`, `fade-in-0`).
- BulkActionDialog: label do escopo "Todas as pessoas" passa a indicar a parcela atual (`Todas as pessoas desta parcela (N/Total)`) com descrição mais clara sobre o efeito da ação.
- Checkbox: `RiCheckLine`/`RiSubtractLine` agora herdam `text-current` para alinhar com a cor do indicator nativo.
- Landing page: remoção de fundos alternados (`bg-muted/40`) nas seções "Funcionalidades", "Stack" e "Para quem é" para uma leitura visual mais limpa.
- Navbar: aviso de atualização passa a usar o texto "Versão X disponível".

## [2.5.4] - 2026-05-06

Esta versão é uma faxina arquitetural de larga escala sem nenhuma mudança visível ao usuário. Removido código morto, padronizamos identificadores em inglês conforme a convenção do projeto, simplificamos o barrel de Server Actions e consolidamos os arquivos de helpers/queries soltos nas raízes das features dentro de pastas `lib/`. O resultado é uma estrutura previsível e consistente entre features (`actions.ts`, `queries.ts`, `actions/`, `components/`, `hooks/`, `lib/`) e um saldo líquido de −428 linhas de código com zero impacto em comportamento, performance ou banco de dados.

### Alterado
- Padronização da estrutura de `transactions/`: 14 helpers soltos na raiz movidos para `lib/`; barrel `actions.ts` reduzido de 76 linhas de wrappers redundantes para 14 linhas de re-exports puros; `anticipation-actions.ts` movido para `actions/anticipation.ts`.
- Reorganização de `dashboard/`: 8 helpers soltos consolidados em `dashboard/lib/`; orquestradores (`fetch-dashboard-data.ts`, `page-data-queries.ts`) permanecem na raiz como entry points.
- Reorganização de `reports/`: 5 query files na raiz consolidados em `reports/lib/`.
- Reorganização de `payers/`: god file `detail-actions.ts` (21KB) e `detail-queries.ts` movidos para `payers/lib/`.
- `shared/components/`: 9 dos 16 componentes soltos agrupados em 3 novas subpastas temáticas (`brand/`, `widgets/`, `feedback/`).
- `shared/lib/fetch-json.ts` movido para `shared/utils/fetch-json.ts` (categorização correta — utilitário genérico de transporte HTTP).
- Padronização EN dos identificadores remanescentes: 4 constantes globais (`LANCAMENTOS_*` → `TRANSACTIONS_*`), 12 tipos/interfaces (`Lancamento*`/`Pagador*`/`Estabelecimento*` → equivalentes em EN), 13 funções/components exportados (`fetchPagador*`, `EstabelecimentoInput`, `PagadorInfoCard`, etc.), 5 props cross-file (`preLancamentosCount` → `inboxPendingCount`, etc.).
- Server Actions de `insights/` simplificadas: barrel reduzido para re-exports puros.
- Mantidas intencionalmente em PT-BR conforme exceção do `CLAUDE.md`: variáveis locais (`pagador`, `categoria`, `lancamento`), accessor key `pagadorName` (persistida em preferências do usuário), strings de UI.

### Removido
- 14 funções/constantes mortas verificadas via `grep` em todo o repo: `validateCategoriaOwnership`, `getInstallmentAnticipationsAction`, `getAnticipationDetailsAction`, `formatDecimalForDb`, `currencyFormatterNoCents`, `optionalDecimalSchema`, `formatMonthLabel`, `getGoalProgressStatusColorClass`, `MONTH_PERIOD_PARAM`, `calculateRemainingInstallments`, e 5 funções `fetch*` não usadas em `inbox/queries.ts`.
- 1 tipo morto: `ImportRow` em `transactions/actions/import-action.ts`.
- 2 tipos órfãos consequentes: `InstallmentAnticipationWithRelations`, `GoalProgressStatus` (este último convertido em interno).
- ~30 `export` keywords desnecessários (símbolos usados apenas no próprio arquivo) — visibilidade reduzida sem mudar comportamento.
- Re-exports mortos em barrels: `EstablishmentLogoPicker` em `entity-avatar/index.ts`, `CategoryReportSkeleton` e `WidgetSkeleton` em `skeletons/index.ts`, `toNameKey` em `establishment-logo-queries.ts`.
- Arquivo `features/reports/types.ts` (barrel inteiro era órfão — todos os 5 tipos eram importados direto de `@/shared/lib/types/reports`).

## [2.5.3] - 2026-05-05

Esta versão foca em polimento do diálogo de detalhes do lançamento, refresh visual da linha do tempo de parcelas e limpeza terminológica em torno de contas/cartões inativos. O diálogo de detalhes ganhou logo da conta/cartão, ícone colorido por categoria e avatar do responsável; a barra de progresso de parcelas foi redesenhada num layout horizontal compacto; e o widget "Minhas Contas" do dashboard passou a ocultar automaticamente contas marcadas como inativas. Internamente, o termo "arquivadas" foi padronizado como "inativas" nas tabs de contas e cartões, surgiram constantes compartilhadas para formas de pagamento liquidáveis e um helper `isAccountInactive`, e o seed de mock data ganhou cobertura mais realista (novas pessoas, contas, cartões e assinaturas recorrentes).

### Adicionado
- Logo da conta/cartão, ícone colorido por categoria e avatar do responsável no diálogo de detalhes do lançamento.
- Constantes `SETTLEABLE_PAYMENT_METHODS` e `CREDIT_CARD_PAYMENT_METHOD` em `features/transactions/constants.ts`.
- Helper `isAccountInactive(status)` em `shared/lib/accounts/constants.ts`, reaproveitado em `account-card.tsx` e `my-accounts-widget.tsx`.

### Alterado
- Widget "Minhas Contas" do dashboard agora oculta contas inativas (filtra antes de aplicar a regra de "não consideradas") e ajusta o empty state quando o usuário só tem contas inativas.
- Linha do tempo de parcelas (`InstallmentTimeline`) redesenhada: layout horizontal com barra de progresso, datas de compra e quitação alinhadas nas pontas e contador "N restante(s)" / "Última parcela" abaixo.
- Diálogo de detalhes do lançamento: badge de status "Pendente" virou "Em aberto" com variante `info`, "Resumo" virou "Total" e ID do lançamento passou a exibir o UUID completo em fonte monoespaçada (sem truncar).
- Tabs em contas e cartões: "Arquivadas/Arquivados" renomeadas para "Inativas/Inativos".
- Legenda do calendário envolvida em `Card` para destacar visualmente do conteúdo da página.
- Páginas `cards`, `categories`, `inbox`, `notes`, `payers` perderam `items-start` no `<main>` (alinhamento natural à largura total); `calendar` ajustou gap de 3 para 4.
- Tabela de lançamentos: extraído IIFE de payment-method dos botões de liquidação com as novas constantes compartilhadas; bloco logo+label da coluna Conta/Cartão deduplicado via reuso de variável JSX; removido `capitalize` redundante do label "Venc.".
- Mock data renovado em `scripts/mock-data.ts`: novas pessoas (Mario), novas contas (Itaú Personnalité, Banco Inter), novo cartão Inter Black, e cobertura mais ampla de assinaturas recorrentes (Vivo, Sabesp, Disney+, HBO Max, Amazon Prime, OpenAI, Apple iCloud, Notion, YouTube Premium).

### Removido
- Comentário narrativo `{/* Opções de Antecipação */}` em `transactions-columns.tsx`.
- Helper local `shortTransactionId` em `transaction-details-dialog.tsx` (substituído pela exibição do UUID completo).

## [2.5.2] - 2026-05-04

Esta versão traz melhorias visuais e de usabilidade em contas, lançamentos, orçamentos, cartões e anotações: novos tipos de conta, ícones no seletor, feedback visual de limite excedido nas progress bars e refinamentos nos ícones de tarefas em anotações.

### Adicionado
- Novos tipos de conta `"Dinheiro"` e `"Outros"` na lista padrão do diálogo de contas (issue #50).
- Ícones por tipo de conta no seletor (Conta Corrente, Poupança, Carteira Digital, Investimento, Pré-Pago, Dinheiro, Outros).
- Filtro automático: ao selecionar `"Dinheiro"` como forma de pagamento em lançamentos, o select de conta exibe apenas contas do tipo `"Dinheiro"`.
- Sinal `+` no valor de transferências recebidas na tabela de lançamentos (mantém cor azul).

### Alterado
- Forma de pagamento de novas transferências entre contas alterada de `"Pix"` para `"Transferência bancária"`.
- Progress bar de orçamentos excedidos agora exibe indicador e fundo na cor `destructive`.
- Progress bar de cartões com 100% do limite utilizado agora exibe indicador e fundo na cor `destructive`.
- Ícone de tarefa não concluída no card e no modal de detalhes de anotações substituído por `RiSubtractLine` (locais sem interação de marcação).

## [2.5.1] - 2026-05-04

Versão de correção pontual focada na exibição do indicador de anexo nas tabelas de lançamentos da fatura do cartão. Em `/cards/[cardId]/invoice`, lançamentos com anexos não mostravam o ícone porque o fetcher dedicado da fatura não calculava o flag `hasAttachments`. A primeira tentativa de adicionar o EXISTS via `extras` na query relacional gerou SQL inválido (Drizzle re-aliasava `transactionAttachments.transactionId` para o alias da tabela externa). A correção definitiva troca o fetcher pela função compartilhada `fetchTransactionsWithRelations` de `features/transactions`, que já implementa o EXISTS corretamente via `select`.

### Corrigido
- Ícone de anexo voltou a aparecer na tabela de lançamentos da fatura do cartão (`/cards/[cardId]/invoice`). `fetchCardTransactions` em `features/invoices/queries.ts` agora delega para `fetchTransactionsWithRelations`, garantindo que o flag `hasAttachments` seja preenchido com a mesma EXISTS subquery usada no restante do app.

## [2.5.0] - 2026-05-01

Esta versão melhora o fechamento de faturas, a correção de lançamentos já registrados e a conferência de saldos contra o extrato do banco. O novo **ajuste de fatura** fecha a conta entre o total calculado pelo sistema e o valor real cobrado pelo banco, sem exigir que o usuário reabra lançamentos individuais. A mesma ideia foi estendida para **contas correntes**: na página do extrato, ao lado de "Saldo ao final do período", o usuário informa o saldo real e o sistema cria (ou atualiza) um lançamento de ajuste no período visualizado. Também entra o fluxo de **reembolso** para despesas à vista: pelo menu de ações do lançamento, o usuário informa a data do reembolso e o sistema cria uma receita espelhada no extrato ou na fatura correta. O widget de boletos do dashboard ganhou paridade com o widget de faturas — confirmação de pagamento agora pede conta de origem e data antes de quitar o boleto. Por fim, o **limite do cartão** passou a ser obrigatório e o sistema bloqueia despesas em cartão que ultrapassem o limite disponível, retornando uma mensagem com o valor exato disponível. As operações mantêm rastro no lançamento gerado e respeitam a proteção de faturas já pagas.

### Adicionado
- Nome do boleto no widget de Boletos agora é um link para `/transactions?q=<nome>`, incluindo `?periodo=<mes-ano>` automaticamente quando o período selecionado não é o atual. Ícone `RiExternalLinkLine` ao lado do nome, igual ao padrão do widget de Faturas.
- Botão "Ajustar fatura" ao lado do valor na página da fatura.
- Dialog `AdjustInvoiceDialog` com input de valor correto e preview da diferença.
- Action `adjustInvoiceAction` que faz upsert/delete idempotente do lançamento de ajuste.
- Botão "Ajustar saldo" ao lado do valor na página do extrato da conta.
- Dialog `AdjustBalanceDialog` com input do saldo correto e preview da diferença que será lançada (receita ou despesa).
- Action `adjustAccountBalanceAction` que faz upsert/delete idempotente do lançamento de ajuste por `(accountId, period)`.
- Opção "Reembolso" no dropdown de ações de despesas à vista, posicionada após "Copiar" e antes de "Remover".
- Dialog `RefundTransactionDialog` com seleção da data do reembolso e indicação do período de destino.
- Action `refundTransactionAction` que cria uma receita de reembolso vinculada ao lançamento original.
- Constantes compartilhadas `INVOICE_ADJUSTMENT_NAME`, `ACCOUNT_BALANCE_ADJUSTMENT_NAME`, `REFUND_NOTE_PREFIX` e `buildRefundNote()` em `shared/lib/accounts/constants.ts`.
- Validação de limite de cartão: `validateCardLimit()` em `transactions/actions/core.ts` calcula o uso atual do cartão (somando lançamentos não quitados, com a mesma regra usada em `cards/queries.ts` para recorrentes) e bloqueia criação ou edição de despesa em cartão que ultrapasse o disponível, retornando "Lançamento de R$ X excede o limite disponível do cartão (R$ Y)."
- Schema reutilizável `requiredDecimalSchema(fieldName)` em `shared/lib/schemas/common.ts` — número/string positiva (`> 0`) com mensagens parametrizáveis.

### Alterado
- **Limite do cartão é obrigatório**: campo `limite` em `cartoes` ganhou `NOT NULL DEFAULT 0` no schema, validação Zod com `requiredDecimalSchema("limite")`, atributo `required` no input do formulário e checagem client-side antes do submit. Tipos `Card.limit` e `Card.limitAvailable` deixam de ser nullable; branch "Ainda não há limite registrado" foi removido de `card-item.tsx` e a derivação defensiva em `cards/[cardId]/invoice` foi simplificada.
- Migration `0029_friendly_spitfire`: preenche com `0` registros legados antes do `SET NOT NULL` para não quebrar bancos com cartões sem limite.
- Métricas principais passam a tratar reembolsos como abatimento de despesa, não como receita comum.
- Cards de receitas/despesas, série histórica do dashboard e resumo do extrato agora preservam o efeito líquido do reembolso no balanço sem inflar entradas e saídas.
- Pagamento de fatura agora abre confirmação com conta de origem selecionável; por padrão vem a conta vinculada ao cartão, mas o usuário pode escolher outra conta antes de confirmar.
- Widget de faturas no dashboard ganhou a mesma confirmação: o modal "Confirmar pagamento" agora pede conta de origem e data antes de marcar a fatura como paga, alinhando o comportamento ao da página de fatura.
- Widget de boletos no dashboard ganhou a mesma paridade: o modal "Confirmar pagamento" passou a oferecer seleção de **conta de pagamento** e **data do pagamento**, com mesma estrutura de cards de detalhes, métricas, separator e formulário condicional do widget de faturas.
- `toggleTransactionSettlementAction` agora aceita `paymentAccountId` e `paymentDate` opcionais para boletos — quando informados, atualiza a `accountId` do lançamento e usa a data escolhida em `boletoPaymentDate` (em vez da data atual).
- `DashboardBill` passa a expor `accountId` para que o dialog inicialize a conta com o valor já vinculado ao boleto.
- Widget "Lançamentos por Categorias" agora ignora a categoria "Transferência interna" — transferências entre contas próprias deixam de poluir o ranking de categorias.

### Corrigido
- Erro de hidratação no widget de Anotações: `Intl.DateTimeFormat` sem `timeZone` usava o fuso do servidor (UTC) no SSR e o fuso do browser (BRT) no cliente, resultando em datas divergentes. Ambos os formatters passam a usar `timeZone: "America/Sao_Paulo"` explicitamente.
- Extrato da conta agora contabiliza transferências internas nos cards de **Entradas** e **Saídas**: transferência recebida soma em Entradas, transferência enviada soma em Saídas. Antes o saldo final refletia o movimento mas os cards permaneciam zerados, gerando inconsistência visível na tela (issue #47).

### Removido
- Seção "Veja o que você pode fazer" (galeria de screenshots com abas) da landing page, junto com o componente `ScreenshotTabs`, as 14 imagens `preview-*.webp`, o bloco `screenshots` em `images.ts`, o link `#telas` do nav e o export `pwaCompatList` sem uso.
- Exports mortos `dateFormatter` e `monthFormatter` de `features/transactions/formatting-helpers.ts`.

## [2.4.4] - 2026-04-27

Esta versão remove a dependência da extensão `pgcrypto` do PostgreSQL para a geração do `share_code` em pagadores. O default a nível de banco (`gen_random_bytes`) foi removido — agora a aplicação gera o código sempre via `crypto.randomBytes` do Node.js, num utilitário compartilhado. A consequência prática é que o setup inicial fica mais simples: não há mais script de habilitação de extensão, nem etapa extra no primeiro `db:push`, e bancos restaurados de dumps externos não precisam ter `pgcrypto` instalada. O script de backup também foi enxugado para gerar dumps focados nos schemas relevantes (`public` e `drizzle`), descartando os schemas internos do Supabase e eliminando os ~148 erros de restore em PostgreSQL padrão. Por fim, os logos da marca (ícone laranja e wordmark) foram vetorizados: as PNGs antigas foram substituídas por SVGs inline em componentes próprios e por arquivos `.svg` no `public/`, escalando perfeitamente em qualquer tamanho — inclusive nos PDFs exportados, que agora rasterizam o SVG em alta resolução.

### Alterado

- Schema: coluna `share_code` em `pagadores` perdeu o default `substr(encode(gen_random_bytes(24), 'base64'), 1, 24)` — campo continua `NOT NULL` e a aplicação passa a fornecer o valor explicitamente em todas as inserções
- Pagadores: nova função utilitária `generateShareCode()` em `src/shared/lib/payers/share-code.ts` (server-only) — usa `crypto.randomBytes(18).toString("base64url").slice(0, 24)`
- Pagadores: `createPayerAction`, `ensureDefaultPagadorForUser`, `resetUserAppData` (settings) e `mock-data.ts` agora chamam `generateShareCode()` ao inserir um pagador
- Backup: `scripts/backup.sh` agora dumpa apenas os schemas `public` e `drizzle` — schemas internos do Supabase (`auth`, `realtime`, `storage`, `vault`, `graphql`, `graphql_public`, `extensions`, `pgbouncer`) e suas extensions/roles deixam de poluir os dumps. Restaurações em PostgreSQL padrão passam a executar sem os ~148 erros de `role/extension does not exist`
- Logo: `Logo` foi quebrado em três arquivos — `src/shared/components/logo.tsx` (orquestrador), `logo-icon.tsx` (ícone laranja em SVG inline, viewBox `0 0 200 200`) e `logo-text.tsx` (wordmark em SVG inline, viewBox `0 0 574.201 89.6`). API pública (`variant`, `invertTextOnDark`, `colorIcon`, `iconClassName`, `textClassName`) preservada
- Assets: `public/images/logo_small.png` e `logo_text.png` substituídos por `logo_small.svg` e `logo_text.svg` (com `width`/`height` explícitos para compatibilidade com `<img>` em canvas)
- Exports: `loadExportLogoDataUrl` agora carrega SVG e rasteriza no canvas a 4× a resolução natural antes de gerar o data URL — mantém nitidez quando o PDF amplia a imagem

### Removido

- Pasta `scripts/postgres/` (continha `init.sql` e `enable-extensions.ts`)
- Script `pnpm db:extensions` no `package.json`
- Referências ao `pnpm db:extensions` no README
- `public/images/logo_small.png` e `public/images/logo_text.png` (substituídos pelos `.svg`)

### Corrigido

- Migrations: conflito de numeração resolvido — `0027_fancy_reaper` renomeado para `0028_fancy_reaper` (o número 0027 já estava ocupado pelo arquivo órfão `0027_glorious_mindworm`); journal e snapshot atualizados
- TS: removido `baseUrl` do `tsconfig.json` para evitar erro `TS5101` (deprecação no TS 7) — `moduleResolution: bundler` resolve os `paths` relativos ao próprio `tsconfig`, dispensando `baseUrl`

### Documentação

- README: seção Backup atualizada — arquivos gerados agora especificam que apenas os schemas `public` e `drizzle` são dumpados
- README: seção Restore reescrita com o fluxo correto para banco Docker (`DROP SCHEMA public CASCADE` + `pg_restore --clean --if-exists --disable-triggers`)
- README: comando rápido de Docker Compose de backup/restore substituído por `pnpm backup`
- README: header passa a apontar para `logo_small.svg`

## [2.4.3] - 2026-04-25

Esta versão amplia o trabalho com lançamentos divididos: anexos passam a ser visíveis para pessoas com acesso compartilhado, a importação para conta própria copia os arquivos de forma independente e a edição ganha a opção de aplicar a alteração nos dois lados do par. Três caminhos de deleção foram corrigidos para não deixar arquivos órfãos no storage. Também traz refresh visual nos badges de tipo e radio buttons, prefetch server-side de logos para reduzir chamadas de API no dashboard, e ajustes pontuais no healthcheck do container e em rótulos da UI.

### Adicionado

- Schema: coluna `split_group_id` (uuid, nullable) em `lancamentos` com índice `(user_id, split_group_id)` — liga as shares do mesmo evento de divisão
- Split: `buildLancamentoRecords` atribui um `splitGroupId` único por cycle (parcelado, recorrente ou único) para ambas as shares
- Split: edição cooperativa via `updateTransactionSplitPairAction` — ao editar um lançamento dividido, novo dialog `SplitPairDialog` permite escolher entre aplicar somente neste lado ou nos dois lados (nome, data, categoria e demais campos compartilhados; valor e payer permanecem por share)
- Importação: "Importar para Minha Conta" agora copia os anexos do lançamento-fonte para a conta de quem está importando (novo arquivo, novo `userId`, novo `fileKey` — cópia independente via S3 CopyObject). `createSchema` ganhou campo opcional `importFromTransactionId`; helper `copyAttachmentsForImport` valida acesso à fonte via ownership direto ou `payerShares`
- Importação: dialog "Importar para Minha Conta" exibe seção read-only "Anexos que serão copiados" listando os anexos do lançamento-fonte antes da confirmação
- Filtros: nova chave `isDivided` na tabela de lançamentos — toggle "Somente divididos" no drawer de filtros mantém o estado na URL
- Performance: prefetch server-side de mapeamentos Logo.dev no `/dashboard`, `/transactions` e `/payers/[payerId]` — uma única query SQL em batch (`fetchEstablishmentLogoMap`) semeia o cache do React Query antes do primeiro render, eliminando os N requests para `/api/logo/mapping`

### Alterado

- Anexos: `fetchTransactionAttachments` e `fetchTransactionAttachmentsAction` passam a autorizar leitura por acesso à transação (direto ou via `payerShares`), permitindo que pessoas com pagador compartilhado visualizem anexos de lançamentos divididos
- Anexos: upload (`confirmAttachmentUploadAction`) e detach em massa (`detachAttachmentBulkAction`) agora expandem `transactionIds` para incluir shares irmãs via `splitGroupId` — o vínculo em `transaction_attachments` é replicado para manter simetria
- Anexos: delete/detach continuam restritos ao criador (sem alteração de escrita); dashboard (`fetchAttachmentsForPeriod`) permanece listando apenas os anexos do próprio usuário
- Migração: lançamentos divididos criados antes desta versão ficam com `split_group_id` NULL e mantêm o comportamento antigo (anexos não visíveis para a contraparte); apenas splits novos são afetados
- Storage: `deleteS3Object` passa a ignorar `NoSuchKey` silenciosamente — providers S3-compatíveis (ex.: Cloudflare R2) lançam esse erro ao deletar objeto inexistente, ao contrário do comportamento idempotente do S3 padrão
- UI/Badges: `TransactionTypeBadge` redesenhado — substitui o `StatusDot` por ícones direcionais (`RiArrowRightDownLine` receita, `RiArrowRightUpLine` despesa, `RiArrowLeftRightLine` transferência), com borda visível, shadow sutil e variantes dark mode dessaturadas; rótulo "Transferência" abreviado para "Transf."
- UI/Forms: indicador do `RadioGroup` trocado de círculo (`RiCircleLine`) por check (`RiCheckLine`) com fundo sólido `primary` no estado selecionado
- UI/Antecipação: tabela de seleção de parcelas reduzida de quatro para três colunas (estabelecimento + fatura + valor) — informações de parcela e vencimento absorvidas pela coluna do estabelecimento
- Tipografia: fonte Inter agora carrega explicitamente os pesos 500, 600 e 700 (antes derivava de 400)
- Deps: better-auth 1.6.5 → 1.6.9, @aws-sdk/client-s3 3.1032 → 3.1037, @tanstack/react-query 5.99.2 → 5.100.3, @biomejs/biome 2.4.12 → 2.4.13, tailwindcss 4.2.2 → 4.2.4, resend 6.12.0 → 6.12.2

### Corrigido

- Anexos: deleção em massa por série (`deleteTransactionBulkAction`) não chamava cleanup de storage — arquivos ficavam órfãos no S3 após apagar "este e futuros" ou "todos" de uma série parcelada/recorrente com anexo
- Anexos: deleção múltipla por seleção (`deleteMultipleTransactionsAction`) não chamava cleanup de storage — mesmo problema ao selecionar vários lançamentos com anexo e deletar em lote
- Anexos: reset de conta em Ajustes (`resetUserAppData`) não limpava o storage — todos os arquivos do usuário ficavam órfãos no S3 após a operação de zeragem
- Página da pessoa (`/payers/[payerId]`): `fetchPagadorLancamentos` agora calcula `hasAttachments` via `EXISTS`, fazendo o ícone de clipe aparecer na tabela de lançamentos (antes só aparecia em `/transactions`)
- Categorias: mensagem de sucesso ao atualizar exibia "Category atualizada com sucesso." — corrigido para "Categoria atualizada com sucesso."
- Antecipação: rótulos "Category" e "Período" no dialog corrigidos para "Categoria" e "Fatura"
- Docker: healthcheck do container `app` agora usa `127.0.0.1:3000` em vez de `localhost:3000`, evitando connection timeout em hosts com IPv6 (resolvendo [#44](https://github.com/felipegcoutinho/openmonetis/issues/44))

## [2.4.2] - 2026-04-20

Esta versão é quase toda sobre organização e polimento. O código interno do Dashboard foi reestruturado — módulos espalhados pela raiz da feature foram agrupados em subdiretórios coesos e a arquitetura de widgets foi renovada com um novo `widget-registry`. A sidebar lateral foi aposentada em favor de uma navegação concentrada na navbar. A interface passou por um refinamento visual amplo: cards redesenhados, dark mode mais consistente e efeitos decorativos removidos para uma composição mais limpa. As imagens de preview da landing page foram atualizadas. Por fim, a integração com Logo.dev ganhou uma arquitetura mais segura — o token agora é lido apenas no servidor e nunca chega ao cliente. O conceito de "Pagador" foi renomeado para "Pessoa" em toda a interface.

### Adicionado

- Dashboard: nova arquitetura de widgets com `widget-registry` — módulos reorganizados em subdiretórios (`bills/`, `invoices/`, `notes/`, `notifications/`, `overview/`, `payments/`, `goals-progress/`, `categories/`)
- Dashboard: novos componentes `category-breakdown-chart`, `category-breakdown-list`, `goals-progress-item` e `percentage-change-indicator`
- Logo.dev: `server.ts` com `isLogoDevEnabled()` e `buildLogoDevUrl()` server-side; `LogoDevProvider` propaga flag `enabled` para Client Components
- Scripts: `mockup` adicionado ao `package.json` (`tsx scripts/mock-data.ts`)

### Alterado

- Nav: sidebar lateral removida — navegação unificada na navbar
- UI/Tema: raio de borda global 0.625rem → 0.7rem; ajustes finos em `--card` e `--border` (light e dark)
- UI: `DotPattern` removido do layout dashboard, tela de autenticação e landing page
- UI: account-card redesenhado com cores de saldo (success/destructive) e tooltip para flags de exclusão
- UI: budget-card, card-item e componentes do calendário (day-cell, event-modal) com layout revisado
- UI: auth-card-shell simplificado (removido glassmorphism e blob animado)
- Landing: imagens de preview atualizadas; `mainFeatures` + `extraFeatures` unificados em grid único; dark mode nos botões de CTA
- Navbar: dark mode corrigido no navbar-shell (`dark:bg-card`, `dark:border-b-border`)
- Logo.dev: `NEXT_PUBLIC_LOGO_DEV_TOKEN` renomeado para `LOGO_DEV_TOKEN` (agora lido em runtime server-side apenas)
- UI: conceito "Pagador/Pagadores" renomeado para **"Pessoa/Pessoas"** em toda a interface — labels, títulos, toasts, mensagens de erro, cabeçalhos de tabela e exportações. Código, rotas (`/payers`) e schema do banco (`pagadores`) permanecem inalterados; a divergência entre UI e código é intencional
- Deps: next 16.2.3 → 16.2.4, better-auth 1.6.2 → 1.6.5, ai 6.0.159 → 6.0.168 e outros patches menores
- Notas/Tarefas: ícone de tarefa concluída em visualização (card e detalhes) simplificado para `RiCheckLine` verde sem caixa; checkbox no modal de edição usa fundo e borda `success` com ícone `success-foreground` (claro no light, escuro no dark)
- Notas/Detalhes: botões do footer reordenados ("Cancelar" à esquerda, "Alterar" primário à direita)

### Removido

- Nav: componentes sidebar (`app-sidebar`, `nav-main`, `nav-secondary`, `nav-user`, `nav-link`), `sidebar.tsx` e `use-mobile.ts`
- Dashboard: ~25 widgets monolíticos obsoletos (`inbox-widget`, `bills-widget`, `notes-widget`, `payers-widget`, `my-accounts-widget` etc.)
- Dashboard: arquivos dispersos na raiz da feature movidos para subdiretórios (arquivos antigos removidos)
- CSS: variáveis `--data-7` a `--data-10` removidas do tema
- CI: build arg `NEXT_PUBLIC_LOGO_DEV_TOKEN` removido do `Dockerfile` e do workflow `docker-publish.yml` — basta configurar `LOGO_DEV_TOKEN` e `LOGO_DEV_SECRET_KEY` como variáveis de runtime no host (Coolify, Railway, etc.)

## [2.4.1] - 2026-04-16

Versão pequena com refresh visual nas telas de autenticação (efeito blob com três círculos coloridos em movimento e card com glassmorphism), capitalização dos labels da navbar para melhor legibilidade e otimização do banco com 17 índices novos em foreign keys — evitando sequential scans em deletes em tabelas grandes como `lancamentos`. Corrigida regressão no `postgres:18-alpine` que recusava iniciar em instalações existentes; adicionada variável `PGDATA` no compose para preservar dados de quem já tinha o volume populado.

### Adicionado

- UI/Auth: layout animado nas páginas de login e signup com efeito blob (3 círculos coloridos em movimento) e card com glassmorphism; layout compartilhado extraído para `app/(auth)/layout.tsx` eliminando duplicação (PR #42)
- DB: 17 índices em foreign keys — evita sequential scans em deletes nas tabelas pai. Impacto maior nas FKs de `lancamentos` (conta_id, categoria_id, antecipacao_id), onde deletes em `categorias` antes provocavam full scan na tabela de lançamentos

### Alterado

- UI/Navbar: labels capitalizados (Lançamentos, Categorias, Contas) em vez de caixa baixa — melhora legibilidade (PR #42)

### Removido

- DB: 7 índices sem uso — `tokens_api_user_id_idx`, `cartoes_user_id_status_idx`, `contas_user_id_status_idx`, `pagadores_user_id_status_idx`, `pagadores_user_id_role_idx`, `dashboard_notification_states_user_id_archived_idx`, `antecipacoes_parcelas_series_id_idx` (0 scans em 187 dias de estatísticas)
- UI/Settings: tab de Integrações órfã removida (não tinha `TabsContent` correspondente)

### Corrigido

- Docker: container do PostgreSQL falhava ao iniciar em instalações existentes após atualização da imagem `postgres:18-alpine` — entrypoint passou a recusar dados no caminho legado `/var/lib/postgresql/data`. Adicionada variável `PGDATA` no `docker-compose.yml` para fixar o caminho e preservar dados de quem já tinha o volume populado (resolve #41)

## [2.4.0] - 2026-04-13

Esta versão integra o serviço Logo.dev para exibir automaticamente logos de marcas na coluna de estabelecimentos dos lançamentos, com picker manual para fixar o domínio quando a sugestão automática não acerta. As consultas vão por novas rotas de API (`/api/logo/search` e `/api/logo/mapping`) que servem como proxy seguro — a secret key fica server-side. Inclui também tabela própria `establishment_logos` com PK composta `(user_id, name_key)` para persistir as preferências por usuário.

### Adicionado

- Estabelecimentos: integração com Logo.dev — logos automáticos de marcas exibidos na coluna de estabelecimentos nos lançamentos
- Estabelecimentos: picker de logo por estabelecimento — clique no avatar para buscar e fixar um domínio Logo.dev específico (salvo por usuário no banco)
- API: rotas `/api/logo/search` e `/api/logo/mapping` — proxy seguro para Logo.dev Brand Search API (secret key server-side) e consulta de mapeamentos salvos
- Schema: tabela `establishment_logos` com PK composta `(user_id, name_key)` para persistir preferências de logo por usuário

### Corrigido

- Dev: `.env.example` usava host `db` no `DATABASE_URL`, causando erro `EAI_AGAIN` ao rodar `pnpm dev` localmente — corrigido para `localhost`

### Documentação

- README: tabela comparativa entre Perfil 1 (Usar) e Perfil 2 (Desenvolver) com diferenças de setup, `DATABASE_URL` e instruções de atualização
- README: seção "Variáveis de Ambiente" esclarecida — distingue contexto Docker (Perfil 1) de desenvolvimento local (Perfil 2)
- Logo.dev: crie uma conta em logo.dev para obter as chaves `NEXT_PUBLIC_LOGO_DEV_TOKEN` e `LOGO_DEV_SECRET_KEY` — plano gratuito inclui 500.000 requisições/mês

## [2.3.8] - 2026-04-12

Refatoração do `docker-compose.yml` para virar standalone — agora basta um `curl` + `docker compose up -d`, sem dependências de arquivos externos ou profiles complexos. README reescrito em dois perfis claros (Usar com Docker e Desenvolver com hot-reload) e scripts npm reduzidos de 10 para 5.

### Alterado

- Docker: `docker-compose.yml` refatorado — removidos profiles, build e dependência de arquivo externo; compose agora é standalone (basta `curl` + `docker compose up -d`)
- Docker: `docker-entrypoint.sh` simplificado — extensão `pgcrypto` criada via Node.js antes das migrations; loop de retry reescrito; removido hack `@localhost → @db`
- Docker: scripts reduzidos de 10 para 5 — `docker:up`, `docker:db`, `docker:down`, `docker:logs`, `docker:update`
- Docs: README reestruturado em dois perfis claros — **Usar** (só Docker) e **Desenvolver** (hot-reload)

## [2.3.7] - 2026-04-11

Esta versão amplia significativamente o dashboard com três novos widgets configuráveis (Anexos, Inbox, Tendências de Categoria), adiciona filtros úteis na tabela de lançamentos (por status de pagamento e por presença de anexo) e moderniza a tipografia substituindo a fonte local por Inter (Google Fonts, self-hosted pelo Next.js) — eliminando arquivos `.woff2` do repositório. Pesos tipográficos foram padronizados para `font-semibold` em títulos, rótulos e valores monetários, e o card de grupo de parcelas foi redesenhado expandindo num dialog de detalhes com parcelas pagas/pendentes separadas. No backend, a CSP foi expandida para permitir preview de anexos PDF via S3, e o setup ganhou script `install-deps.sh` pra preparar servidores Ubuntu 24.04 limpos.

### Adicionado

- Dashboard: novos widgets configuráveis — Anexos (resumo de arquivos do período), Inbox (snapshot de pré-lançamentos pendentes) e Tendências de Categoria
- Lançamentos: filtro por status de pagamento (somente pagos / somente não pagos) e filtro por presença de anexo
- Lançamentos: indicador visual no status de liquidação para lançamentos de cartão de crédito com fatura paga — exibe ícone verde com tooltip explicativo
- Scripts: `scripts/install-deps.sh` — script de preparação para servidores Ubuntu 24.04 limpos (instala Docker, Node.js 22, pnpm via Homebrew)
- Docker: variáveis `PUBLIC_DOMAIN`, `UMAMI_URL`, `UMAMI_WEBSITE_ID` e `UMAMI_DOMAINS` passadas ao container da aplicação no `docker-compose.yml`

### Alterado

- Fonte: substituída fonte local `America` por `Inter` (Google Fonts, self-hosted pelo Next.js) — elimina arquivos `.woff2` do repositório
- Tipografia: peso tipográfico padronizado de `font-medium` para `font-semibold` em títulos, rótulos e valores monetários em toda a interface
- Parcelas: redesenho do card de grupo de parcelas — expandindo para dialog de detalhes com parcelas pagas/pendentes separadas
- Inbox: redesenho do card de pré-lançamento — logo maior, hierarquia tipográfica melhorada
- Lançamentos: filtros de tipo, condição e forma de pagamento agora usam slugs em URL (ex: `receita` em vez do valor literal com acentos)
- Estabelecimento: popover de autocomplete agora respeita a largura do input ao abrir
- CSP: adicionado `frame-src` para permitir preview de anexos PDF via S3

### Corrigido

- Docker: corrigido crash loop no container com mensagem `exec /app/docker-entrypoint.sh: no such file or directory` causado por CRLF no `docker-entrypoint.sh` em ambientes Windows/WSL2 — adicionado `sed -i 's/\r$//'` no Dockerfile e `.gitattributes` com `eol=lf` para scripts shell
- S3: corrigido `Error: Region is missing` ao usar o app sem S3 configurado — `S3_REGION` vazio (string vazia) não era tratado pelo operador `??`; substituído por `||` em todo o `s3-client.ts`
- i18n: corrigidas mensagens de erro que exibiam "Payer" em inglês em vez de "Pagador"
- Logos: corrigido modal seletor de logos de cartões e contas para renderizar miniaturas sem avisos de proporção
- Scripts: `install-deps.sh` — spinner travava o script por `wait` retornar código não-zero com `set -e` ativo; corrigido com `|| true`
- Scripts: `install-deps.sh` — prompt interativo do corepack suprimido com `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`
- Scripts: `install-deps.sh` — PATH do Homebrew não estava configurado na seção de resumo

### Removido

- Scripts: removidos arquivos órfãos `scripts/dev.ts` e `scripts/setup-env.sh` (substituídos pelo `setup.mjs`)
- Docker: `docker-compose.yml` agora funciona sem arquivo `.env` — `DATABASE_URL` tem valor padrão com credenciais de desenvolvimento
- Docker: `docker-entrypoint.sh` converte automaticamente `@localhost:` para `@db:` na `DATABASE_URL` ao iniciar o container, eliminando a necessidade de usar hosts diferentes no `.env` para desenvolvimento local e Docker

## [2.3.6] - 2026-04-09

Correção pontual no Docker — adicionado `NODE_PATH=/app/migrate/node_modules` no entrypoint para o `drizzle-kit` resolver corretamente o `drizzle-orm` ao executar as migrations no container.

### Corrigido

- Docker: adicionado `NODE_PATH=/app/migrate/node_modules` no entrypoint para que o `drizzle-kit` consiga resolver `drizzle-orm` ao executar as migrations no container

## [2.3.5] - 2026-04-07

Correção crítica na CSP: regra movida do `next.config.ts` (build time) para `proxy.ts` (runtime), desbloqueando uploads de anexos quando o `S3_ENDPOINT` ainda não estava disponível durante o build da imagem Docker.

### Corrigido

- CSP: movido `Content-Security-Policy` do `next.config.ts` (build time) para `proxy.ts` (runtime), corrigindo bloqueio de upload de anexos quando `S3_ENDPOINT` não estava disponível durante o build do Docker

## [2.3.4] - 2026-04-05

Correção pontual no upload de anexos — a CSP `connect-src` bloqueava o fetch para o storage, gerando `NetworkError` na hora de subir o arquivo.

### Corrigido

- Anexos: corrigido upload que falhava com `NetworkError` — CSP `connect-src` bloqueava fetch para o Storage

## [2.3.3] - 2026-04-05

Correção do fluxo de tokens da API: `/api/auth/device/verify` voltou a aceitar tokens criados pela tela de Settings (revertido de JWT para hash lookup). O prefixo dos tokens também foi renomeado de `os_` para `opm_` (OpenMonetis) e rotas JWT não utilizadas foram removidas — usuários precisam recriar os tokens existentes.

### Corrigido

- Tokens: corrigido `/api/auth/device/verify` que rejeitava tokens criados via Settings (revertido de JWT para hash lookup)

### Alterado

- Tokens: prefixo renomeado de `os_` para `opm_` (OpenMonetis); tokens existentes precisam ser recriados
- Tokens: removidas rotas JWT não utilizadas (`/api/auth/device/token` e `/api/auth/device/refresh`)
- Tokens: `api-token.ts` simplificado para conter apenas `hashToken` e `extractBearerToken`

## [2.3.2] - 2026-04-04

Esta versão concentra hardening de segurança. Tokens da API ganharam expiração obrigatória de 1 ano (sem mais tokens eternos) e o refresh foi corrigido para validar JWT por assinatura. A CSP foi expandida com `default-src`, `script-src`, `style-src`, `img-src`, `font-src` e `connect-src` (no lugar de uma regra única ampla), e foi adicionada mitigação para CVE-2024-44294 desabilitando parsing de fórmulas em `xlsx`. Inclui ainda novos headers (`Referrer-Policy`, `X-Permitted-Cross-Domain-Policies`), respostas `401 JSON` em vez de redirect 302 em rotas autenticadas, `security.txt` (RFC 9116) e correção de URL com protocolo duplicado no sitemap.

### Segurança

- Tokens: removido aceite de tokens sem expiração (`expiresAt NULL`); tokens criados via settings agora expiram em 1 ano
- Tokens: corrigido refresh que sobrescrevia hash e invalidava access token anterior; verify agora valida JWT por assinatura
- xlsx: desabilitado parsing de fórmulas (`cellFormula: false`) para mitigar CVE-2024-44294
- CSP: expandida Content-Security-Policy com `default-src`, `script-src`, `style-src`, `img-src`, `font-src` e `connect-src`
- Headers: adicionados `Referrer-Policy` e `X-Permitted-Cross-Domain-Policies`
- API: rotas autenticadas agora retornam `401 JSON` em vez de redirect `302` para clientes não autenticados
- Health: removido campo `version` da resposta do `/api/health`
- robots.txt: simplificado para não expor mapa de rotas internas
- Sitemap: corrigida URL com protocolo duplicado (`https://https://`)
- Criado `security.txt` (RFC 9116)

## [2.3.1] - 2026-04-03

Correção pontual de infraestrutura — dependências do `drizzle-kit` passaram a ser instaladas em `/app/migrate/` separadamente do `node_modules` do build standalone, corrigindo o erro `Cannot find module 'next'` no startup do container.

### Corrigido

- Infraestrutura: deps do drizzle-kit agora são instaladas em `/app/migrate/` separado do `node_modules` do standalone, corrigindo erro `Cannot find module 'next'` no startup do container

## [2.3.0] - 2026-04-03

Esta versão introduz `@tanstack/react-query` no projeto, padronizando cache, deduplicação e invalidação de leituras client-side. Várias features (anexos, insights, antecipação de parcelas) passaram a usar React Query no lugar de `useEffect` manual sobre rotas GET dedicadas. O dashboard ganhou ajuda contextual em cada métrica e configuração persistida pra ocultar contas marcadas como não consideradas no saldo total; o menu do usuário na navbar passou a avisar quando há release nova publicada no GitHub; e o Docker passou a rodar migrations automaticamente no startup via `docker-entrypoint.sh`. Internamente, o `knip` foi adicionado pra auditar arquivos/exports/tipos sem uso, várias rotas e actions ganharam validações extras (filtros por `userId` em joins, rate limits explícitos no Better Auth, headers `Cache-Control: private, no-store` em rotas privadas) e o projeto foi atualizado para Next.js 16.2.2 e Biome 2.4.10.

### Adicionado

- Dependências: adiciona `@tanstack/react-query` e um provider global para padronizar cache, deduplicação e invalidação de leituras client-side
- Dashboard: widget "Minhas Contas" ganha preferência persistida para mostrar ou ocultar contas marcadas como não consideradas no saldo total
- Dashboard: cards de métricas ganham botão de ajuda com explicação do cálculo exibido no app
- Versionamento: menu do usuário na navbar passa a avisar quando existe release mais recente publicada no GitHub
- Qualidade: adiciona `knip` ao projeto com o script `pnpm run lint:deadcode` para auditar arquivos, exports e tipos sem uso
- Infraestrutura: imagem Docker passa a rodar migrations automaticamente via `docker-entrypoint.sh` antes de iniciar a aplicação

### Alterado

- Anexos: listagem no modal de edição/detalhes, URLs temporárias da galeria e preview deixam de depender de `useEffect` para data fetching direto no componente e passam a usar React Query sobre rotas GET dedicadas
- Insights: carregamento de análises salvas passa a usar React Query com cache por período, mantendo estado draft local apenas para análises recém-geradas ou removidas
- Parcelamentos: histórico de antecipações no diálogo passa a usar React Query com invalidação automática após cancelamento
- Dashboard, insights e relatórios passam a excluir movimentações de contas marcadas como não consideradas no saldo total; balanço e previsto também passam a considerar ajustes de transferências entre contas consideradas e não consideradas
- UX: boletos e faturas passam a exibir labels relativas como "vence hoje", "vence amanhã" e "pago ontem", com tooltip para a data completa
- Lançamentos: diálogo foi reorganizado em blocos mais claros; a criação passa a aceitar múltiplos anexos e a edição em lote preserva `purchaseDate` e `period` ao propagar alterações por série
- Inbox e tabela de lançamentos foram componentizados em partes menores, mantendo paginação e ações em lote mais simples de evoluir
- Infraestrutura: workflow de publish ganha etapa obrigatória de qualidade; `docker-compose` passa a suportar perfil local ou banco remoto; build fixa `pnpm@10.33.0`; projeto atualizado para `Next.js 16.2.2`, `Biome 2.4.10` e dependências correlatas
- Qualidade: `knip` ganha configuração inicial para reduzir falsos positivos, ignorando `src/shared/components/ui/**`, o worker público de PDF, `setup.mjs` e o falso positivo de `postcss`

### Corrigido

- Segurança: criação de antecipações agora valida se `payerId` e `categoryId` informados pertencem ao usuário autenticado antes de persistir referências cruzadas
- Segurança: histórico de antecipações endurece os joins de `transactions`, `payers` e `categories` com filtro por `userId`, evitando exposição de nomes relacionados caso exista referência inconsistente no banco
- Segurança: domínio público deixa de responder rotas `/api/*`, e o Better Auth passa a aplicar rate limits explícitos para login e cadastro por e-mail
- APIs privadas: rotas de anexos, insights salvos, histórico de antecipações e presign de download passam a responder com `Cache-Control: private, no-store`; a rota de antecipações também deixa de devolver mensagens internas de erro ao cliente
- Build: rotas web de tokens do Companion passam a ser explicitamente dinâmicas, removendo o warning de prerender no `next build`
- Lançamentos: edição em série de compras parceladas volta a persistir `purchaseDate` e `period`, permitindo mover parcelas para a fatura ou competência correta conforme o escopo escolhido
- Lançamentos: edições que tentam mover compras de cartão para faturas já pagas agora são bloqueadas com mensagem clara também no fluxo de atualização e propagação em lote
- Imagens: logos institucionais, avatares padrão e componentes com `next/image` em modo `fill` passam a usar containers fixos com `sizes`, removendo avisos de proporção e performance
- Gráficos: `ChartContainer` passa a definir `initialDimension` no `ResponsiveContainer` do Recharts, evitando avisos `width(-1)` e `height(-1)` durante a medição inicial em widgets e relatórios

## [2.2.1] - 2026-04-01

Correção pontual no build da imagem Docker — removido `chown -R /app` do stage final (que travava o build/push da GitHub Action por lentidão excessiva); permissões agora definidas via `COPY --chown` direto.

### Corrigido

- Docker: imagem de produção deixa de executar `chown -R /app` no stage final; as permissões passam a ser definidas nos `COPY --chown`, reduzindo o risco de travamento e lentidão excessiva no build/push da GitHub Action

## [2.2.0] - 2026-04-01

Esta versão entrega uma nova página dedicada de galeria de anexos em `/attachments` com miniaturas, visualização inline (incluindo PDF via `pdfjs-dist`), download direto e acesso a partir do lançamento. As páginas de login e cadastro foram redesenhadas com sidebar mockup de faturas, três blocos de funcionalidade e gradiente decorativo. O dashboard passou a notificar boletos e faturas com vencimento dentro de 5 dias, e o cache do dashboard migrou de `unstable_cache` para a diretiva `use cache` (com `cacheTag` e `cacheLife`), com `cacheComponents: true` no `next.config.ts` e `connection()` em todas as páginas para forçar render dinâmico. A tipografia ganhou peso 500 (Medium) padronizado em títulos, valores e rótulos.

### Adicionado

- Anexos: nova página de galeria em `/attachments` com miniaturas, visualização inline de imagem e PDF, download direto e acesso a partir do lançamento
- Anexos: suporte a visualização de PDF diretamente no app via `pdfjs-dist`
- Autenticação: sidebar redesenhado com mockup de faturas e três itens de funcionalidade; páginas de login e cadastro ganham gradiente decorativo e logo visível no mobile
- Notificações: alertas de vencimento para boletos e faturas do período seguinte exibidos quando o vencimento está dentro de 5 dias
- Documentação: novo arquivo público `public/llms.txt` com resumo do projeto e links curados para documentação, setup e arquitetura

### Alterado

- Performance: queries de cache do dashboard migradas de `unstable_cache` para a diretiva `use cache` com `cacheTag` e `cacheLife`; todas as páginas do dashboard passam a chamar `connection()` para renderização dinâmica; `next.config.ts` adota `cacheComponents: true`
- Tipografia: adicionada fonte America Medium (weight 500); pesos tipográficos padronizados para `font-medium` em títulos, valores e rótulos em todos os componentes
- Anexos: `AttachmentPreview` foi simplificado para exibir apenas nome da transação, nome do arquivo, navegação entre anexos e ações de download, abrir em nova aba e fechar com ícone `X`

### Corrigido

- Lançamentos: uploads e remoções de anexo agora funcionam para todos os lançamentos, não apenas os pertencentes a séries

## [2.1.2] - 2026-03-30

Pequena versão de polimento: novo escopo `"period"` na ação em lote de lançamentos (aplica alteração a todos os lançamentos do período sem sobrescrever o pagador individual de cada um), preferência de tamanho máximo por arquivo de anexo (5/10/25/50/100 MB) persistida no banco e respeitada em todos os pontos de upload, e redesign visual da página de Configurações com separadores entre seções e títulos maiores.

### Adicionado

- Preferências: nova configuração de tamanho máximo por arquivo de anexo (5, 10, 25, 50 ou 100 MB), persistida no banco e respeitada em todos os pontos de upload
- Lançamentos: novo escopo `"period"` na ação em lote, que aplica a alteração a todos os lançamentos do período sem sobrescrever o pagador individual de cada um
### Corrigido

- Lançamentos: ao editar um lançamento de série, uploads e remoções de anexo agora aguardam a escolha de escopo da ação em lote antes de serem executados, evitando que o anexo fosse aplicado no lançamento errado
- Lançamentos: ação em lote com escopo `"period"` não sobrescreve mais o `payerId` individual de cada lançamento ao alterar o pagador

### Alterado

- Configurações: redesign visual da página com separadores entre seções e títulos maiores
- Configurações: seção "Extrato e lançamentos" renomeada para "Lançamentos"

## [2.1.1] - 2026-03-29

Esta versão extrai a navbar pra um componente `NavbarShell` compartilhado entre app e landing page e cria uma variante `navbar` no Button pra centralizar os estilos antes duplicados em `nav-styles.ts`. A integração com `@vercel/analytics`/`@vercel/speed-insights` foi substituída por Umami self-hosted via script tag no layout raiz.

### Adicionado

- Navbar: novo componente `NavbarShell` que unifica a estrutura da barra de navegação entre o app e a landing page
- UI: nova variante `navbar` no componente `Button`, centralizando os estilos de botões usados dentro da navbar
- Analytics: integração com Umami self-hosted via script tag no layout raiz

### Alterado

- Navbar: `AnimatedThemeToggler` e `RefreshPageButton` passam a aceitar prop `variant` para adaptar estilos ao contexto (navbar ou sidebar)
- Navbar: estilos inline duplicados de `nav-styles.ts` migrados para a variante `navbar` do Button
- Logo: prop `showVersion` removida; prop `colorIcon` passa a aplicar filtro de cor também no variant `compact`
- Scripts: `mockup` renomeado para `db:seed`; `db:enableExtensions` renomeado para `db:extensions`; script `dev-env` removido
- Landing: `MobileNav` simplificado com a remoção da prop `triggerClassName`

### Removido

- Navbar: arquivo `nav-styles.ts` removido após migração dos estilos para a variante `navbar`
- Dependências: `@vercel/analytics` e `@vercel/speed-insights` removidos (substituídos pelo Umami self-hosted)

## [2.1.0] - 2026-03-28

Esta versão adiciona suporte a anexos em transações, com upload direto para storage compatível com S3, persistência em tabelas dedicadas (`anexos` e `lancamento_anexos`) e ações de visualizar/remover no detalhe do lançamento. O upload exige token assinado por arquivo, valida ownership da transação na leitura/remoção e confere tamanho/tipo do objeto no storage antes de persistir o vínculo no banco. Inclui também novo workflow `release.yml` que cria tag e GitHub Release automaticamente a partir da versão do `package.json` e da entrada correspondente no `CHANGELOG.md`.

### Adicionado

- Lançamentos: suporte a anexos em transações com upload direto para storage compatível com S3, persistência em tabelas dedicadas (`anexos` e `lancamento_anexos`) e ações de visualizar/remover no detalhe do lançamento
- Infraestrutura: novo workflow `.github/workflows/release.yml` para criar tag e GitHub Release automaticamente a partir da versão do `package.json` e da entrada correspondente no `CHANGELOG.md`

### Alterado

- Anexos: upload agora exige token assinado por arquivo, valida propriedade da transação também na leitura/remoção e confere tamanho/tipo do objeto no storage antes de persistir o vínculo no banco

### Corrigido

- Lançamentos: criação de transações no cartão de crédito agora bloqueia períodos cujas faturas já estão pagas, evitando divergência no relatório de análise de parcelas

## [2.0.3] - 2026-03-26

Correção pontual em `/transactions` — removida dependência de `crypto.randomUUID()` no carregamento inicial, que falhava em ambientes self-hosted sem HTTPS (a API só está disponível em contextos seguros).

### Corrigido

- Lançamentos: `/transactions` deixa de depender de `crypto.randomUUID()` no carregamento inicial, corrigindo a falha em ambientes self-hosted sem HTTPS ao abrir a página

## [2.0.2] - 2026-03-25

Versão focada nas notificações da navbar: novo estado persistido permite marcar alertas de fatura, boleto e orçamento como lidos ou arquivados por usuário; o snapshot global passa a usar o período corrente do negócio (não mais o `periodo` da URL), itens lidos saem do badge e arquivados somem da lista padrão do sino. O filtro foi refinado para um seletor explícito entre `Ativas` e `Arquivadas`. Inclui ajustes pontuais no detalhamento por categoria do dashboard (oculta categorias sem movimentação no período), na arte decorativa do cabeçalho de boas-vindas e na edição em lote de lançamentos em série (que agora propaga também o status de pagamento para transações fora do cartão).

### Adicionado

- Scripts: novo comando `mockup` no `package.json` para executar `scripts/mock-data.ts`
- Navbar: novo estado persistido para notificações do sino, permitindo marcar alertas de fatura, boleto e orçamento como lidos ou arquivados por usuário

### Alterado

- Navbar: o snapshot global de notificações deixa de depender do `periodo` da URL atual e passa a usar o período corrente do negócio; itens lidos saem do badge e itens arquivados somem da lista padrão do sino
- Navbar: dropdown de notificações agora permite mostrar itens arquivados e reverter ações de leitura e arquivamento diretamente em cada item
- Navbar: filtro da lista de notificações no sino foi refinado para um seletor explícito entre `Ativas` e `Arquivadas`, com destaque visual mais forte para a aba ativa
- Navbar: componente `notification-bell` foi desmembrado em hook e componentes locais menores, reduzindo acoplamento e facilitando manutenção
- Dashboard: detalhamento por categoria agora oculta categorias sem movimentação no período, reduzindo ruído visual no card
- UI: arte decorativa do topo da dashboard foi restrita à faixa do cabeçalho de boas-vindas, evitando que o `dot pattern` e o gradiente claro alterem a leitura visual do month picker
- Lançamentos em série: a edição em lote agora também permite propagar o status de pagamento (`isSettled`) para transações não feitas no cartão de crédito
- Seed de conta vazia: `scripts/mock-data.ts` agora processa `--help` antes de exigir `DATABASE_URL` e só cria categorias/pagador admin depois de validar que a conta está financeiramente vazia

### Corrigido

- Navbar: ao desarquivar a última notificação no modo de arquivadas, o dropdown volta automaticamente para a listagem padrão e o toggle deixa de ficar travado
- Filtros financeiros: transações de conta com observação nula, como compras parceladas no Pix, deixam de ser ocultadas indevidamente em `/transactions`, dashboard e relatórios quando a conta está configurada para desconsiderar o saldo inicial
- Backup: geração do arquivo `*.data.sql.gz` volta a usar a saída correta do `pg_restore`

### Removido

- DB: colunas `system_font` e `money_font` da tabela `preferencias_usuario`, que não são mais utilizadas no código

## [2.0.1] - 2026-03-21

Versão de correções na inbox de pré-lançamentos: filtro por app passa a montar a lista completa a partir de todos os itens do status atual (sem depender da página carregada), notificações de cartões/apps sem logo cadastrado passam a usar `default_icon.png` como fallback, e o select de apps exibe os logos. Inclui também correção de divergência entre a versão exibida no UI e a reportada pelo `/api/health` (que agora reporta a versão atual do `package.json`).

### Corrigido

- Inbox: filtro por app em `/inbox` agora monta a lista completa de apps da aba a partir de todos os itens do status atual, sem depender apenas da página carregada, e o SSR deixa de quebrar quando `sourceApps` vier inconsistente
- Inbox: notificações de cartões/apps sem logo cadastrado agora exibem `default_icon.png` como fallback visual nos cards
- Inbox: select de apps em `/inbox` agora exibe os logos dos apps/cartões, com fallback para `default_icon.png` quando não houver logo mapeado
- Inbox: cabeçalhos de data entre grupos de cards agora exibem ícone e tipografia um pouco maior para melhorar a leitura
- Versionamento: `/api/health` passa a reportar a versão atual do `package.json`, evitando divergência entre healthcheck, UI e release publicada

## [2.0.0] - 2026-03-21

Marco importante do projeto. Esta versão consolida ganhos de performance, segurança e organização interna. No backend, paginação server-side real foi implementada em transações, extrato e inbox; o dashboard reduziu de 19 fetchers para 7 blocos com agregações compartilhadas; exportações de PDF/Excel passaram a carregar libs sob demanda apenas no clique; e o cache de dashboard/insights ganhou invalidação segmentada por `userId` (sem fallback global). Internamente, identificadores foram migrados de PT-BR para inglês (`lancamento` → `transaction`, `pagador` → `payer`, `conta` → `account`, etc.) e helpers foram consolidados em módulos de domínio. Visualmente, a navbar e os cards de auth ganharam dot pattern + brilho em primary, faturas tiveram refinamento na hierarquia visual, e a tipografia foi unificada na família America. Inclui ainda script `scripts/backup.sh` para backup automático do PostgreSQL, importação de extratos OFX e XLS/XLSX com tela de revisão e dedup por FITID, e nova opção de zerar dados financeiros sem excluir o usuário.

### Adicionado

- Infraestrutura: script `scripts/backup.sh` para backup automático do banco PostgreSQL; configuração de destino (rclone, cron, retenção) feita separadamente; passa a gerar também `*.data.sql.gz` com dados puros de todas as tabelas públicas (`--data-only --schema=public`)
- Importação de extratos OFX e XLS/XLSX com tela de revisão, detecção automática de categoria por histórico de uso, deduplicação por FITID e acesso direto pela tabela de transações

### Alterado

- Ajustes: aba de exclusão da conta passa a oferecer opção de zerar dados financeiros (preferências, tokens do Companion, compartilhamentos) sem excluir o usuário; categorias e pagador admin são recriados em seguida.
- Performance: paginação server-side real com `count`, `limit` e `offset` em transações, extrato e inbox, com sincronização de `page`, `pageSize` e `status` na URL; `fetchInboxDialogData()` restrito ao fluxo de processamento.
- Performance: dashboard reduzido de 19 fetchers para 7 blocos com agregações compartilhadas; snapshots dedicados para navbar (avatar do pagador admin, notificações, inbox) e quick actions, ambos com cache por usuário.
- Performance: exportações de lançamentos e relatório por categoria carregam `xlsx`, `jspdf` e `jspdf-autotable` sob demanda, apenas no clique.
- Performance: agregação de insights busca o pagador admin uma vez por request, remove joins repetidos com `pagadores` e paraleliza consultas independentes do período.
- Cache: invalidação do dashboard segmentada por `userId` nas server actions; `revalidateForEntity()` agora exige `userId`, sem fallback global para dashboard.
- Cache: agregação de insights com cache por usuário e período, reaproveitando a invalidação financeira segmentada.
- Arquitetura: `getAdminPayerId` adotado em contas, orçamentos, calendário, detalhe de categoria, extrato e actions, eliminando JOINs repetidos com `payers.role`.
- Banco: unique constraints compostas em `faturas` e `orcamentos`, com migration que aborta em caso de duplicatas históricas; actions tratam conflitos de concorrência com `upsert` para status de fatura e `onConflictDoNothing` para orçamentos.
- Qualidade: `pnpm run lint` e `next build` passam sem erros de TypeScript; validação de tipos ativa no build.
- Refatoração: identificadores internos migrados de PT-BR para inglês (`lancamento` → `transaction`, `pagador` → `payer`, `conta` → `account`, `cartao` → `card`, `categoria` → `category`, `orcamento` → `budget`); strings de UI permanecem em português. Search params de lançamentos também migrados (`type`, `condition`, `payment`, `payer`, `category`, `accountCard`).
- Lançamentos recorrentes: criação de todos os meses diretamente no fluxo do lançamento, com seleção explícita da quantidade de meses no formulário.
- UI: `type-badge` renomeado para `transaction-type-badge` com mapeamento centralizado por tipo financeiro; visual unificado em tabela, detalhe de transação e cabeçalho de categoria.
- UI: navbar com `dot pattern` SVG sutil sobre a cor primária, máscara horizontal e camada de luz suave; cards de login/cadastro reaproveitam a mesma linguagem visual com `dot pattern` e brilho em `primary`.
- UI: login e cadastro reequilibrados com espaçamentos mais consistentes, largura útil fixa e cabeçalhos com descrição.
- UI: labels padronizados em formulários, tabelas, relatórios e estados vazios; skeletons com cantos menos arredondados; loading da home espelha estrutura atual (boas-vindas, navegação mensal, cards de métricas e toolbar de widgets).
- Faturas: card de resumo refinado com hierarquia clara para valor, vencimento e status; metadados em blocos discretos e faixa de ação contextual para pagamento e edição de data.
- Tipografia: aplicação carrega apenas a família `America` (`regular`, `medium` e `bold`) como fonte global, removendo personalização por usuário e distinção de fonte para valores monetários.
- Pagadores: a tela de detalhe agora mantém o card principal do pagador visível durante a navegação entre abas, sem repetir o bloco completo dentro de cada seção.
- Pagadores: detalhes sensíveis como envio automático, último envio e observações agora ficam ocultos quando o acesso ao pagador é somente leitura.
- Pagadores: o e-mail do pagador agora aparece apenas no cabeçalho fixo, evitando repetição dentro do card de detalhes.
- Relatório de tendências: a tabela e os cards mobile agora exibem a média mensal do período filtrado ao lado do total, com destaque visual em azul; a coluna de categoria também ficou mais compacta com truncamento para nomes longos.
- Dashboard: o welcome banner deixou de ser um bloco colorido para virar apenas texto destacado.
- UI base: o `Card` compartilhado agora mantém a borda neutra no estado padrão e aplica um gradiente entre `border` e `primary` no hover.
- Assets: imagens que estavam soltas na raiz de `public/` foram movidas para `public/imagens/`, com atualização dos caminhos usados por landing page, logos, exports e manifesto do app.
- Dashboard: `section-cards` foi renomeado para `dashboard-metrics-cards`; `boletos-widget` renomeado para `bill-widget`; widgets componentizados internamente por domínio (`invoices/`, `bills/`, `notes/`, `goals-progress/`, `payment-overview/`, `installment-expenses/`).
- Widgets: `widget-card` foi separado entre um card base e uma versão expansível, isolando a lógica de overflow sem alterar o visual atual dos widgets.
- Datas: helpers de `YYYY-MM-DD`, labels de vencimento/pagamento e o relógio de negócio foram centralizados em `lib/utils/date.ts`, reduzindo drift de timezone em dashboard, pagadores, calendário, exports e actions.
- Lançamentos: a tabela deixou de quebrar ao formatar datas inválidas ou serializadas como ISO completo, normalizando `purchaseDate` para `YYYY-MM-DD` com fallback seguro.
- Logos e cartões: resolução de logos e brand assets foi consolidada em `lib/logo/index.ts` e `lib/cartoes/brand-assets.ts`, com adoção em cartões, contas, notificações, inbox, relatórios e seletores.

### Corrigido

- Relatório de tendências: a coluna Média agora considera apenas os meses com gastos registrados (valores > 0), ignorando meses sem movimentação no cálculo
- Dashboard: ícones de seta nos cards de métricas (receita/despesa) estavam invertidos; cor do card de saldo ajustada para `cyan-600`
- Landing page: gradiente sobreposto removido da hero section
- Lançamentos: o schema compartilhado de observação voltou a aceitar `null`, corrigindo o erro `Invalid input: expected string, received null` ao salvar novos lançamentos sem anotação.
- Cartões/Faturas: o pagamento da fatura passou a usar o valor líquido do período no cartão, evitando que o extrato da conta registre o total bruto das despesas quando houver receitas como estornos ou créditos na mesma fatura.
- Hooks e sincronização: o provider de privacidade voltou a reagir corretamente às mudanças do modo privado, e o resumo de fatura agora reseta a data de pagamento quando a prop inicial deixa de existir.
- Compatibilidade da refatoração de hooks e relatórios: `useMobile`/`useIsMobile` voltaram a ter exports compatíveis, o shim de `components/ui/use-mobile.ts` foi restaurado para o sidebar e `lib/relatorios/types.ts` voltou a reexportar os tipos usados pelos fetchers legados.
- Widgets expansíveis: o shell compartilhado voltou a aplicar `relative` e `overflow-hidden`, mantendo o gradiente e o botão "Ver tudo" presos ao card.
- Dashboard: o widget "Lançamentos por categoria" deixou de ler a categoria salva no `sessionStorage` durante a renderização inicial, evitando mismatch de hidratação entre servidor e cliente.

### Removido

- Dashboard/Ajustes: toda a implementação legada de `magnet-lines` foi removida, incluindo componente órfão, preferência de usuário e a coluna `disable_magnetlines` do schema com migration dedicada.

## [1.7.7] - 2026-03-05

Versão de organização interna sem mudanças visíveis grandes. Períodos e navegação mensal passaram a usar os helpers centrais de período (`YYYY-MM`), hooks locais (calculadora, month-picker, logo picker) foram movidos pra perto das respectivas features e `components/navbar`/`sidebar` foram consolidados em `components/navigation/*`. Análise de parcelas migrou para `/relatorios/analise-parcelas`, exportações em PDF/CSV/Excel ganharam melhor branding e apresentação, e a calculadora teve ajustes de estabilidade no arrasto.

### Alterado

- Períodos e navegação mensal: `useMonthPeriod` passou a usar os helpers centrais de período (`YYYY-MM`), o month-picker foi simplificado e o rótulo visual agora segue o formato `Março 2026`.
- Hooks e organização: hooks locais de calculadora, month-picker, logo picker e sidebar foram movidos para perto das respectivas features, deixando `/hooks` focado nos hooks realmente compartilhados.
- Estado de formulários e responsividade: `useFormState` ganhou APIs explícitas de reset/substituição no lugar do setter cru, e `useIsMobile` foi atualizado para assinatura estável com `useSyncExternalStore`, reduzindo a troca estrutural inicial no sidebar entre mobile e desktop.
- Navegação e estrutura compartilhada: `components/navbar` e `components/sidebar` foram consolidados em `components/navigation/*`, componentes globais migraram para `components/shared/*` e os imports foram padronizados no projeto.
- Dashboard e relatórios: a análise de parcelas foi movida para `/relatorios/analise-parcelas`, ações rápidas e widgets do dashboard foram refinados, e os cards de relatórios ganharam ajustes para evitar overflow no mobile.
- Pré-lançamentos e lançamentos: tabs e cards da inbox ficaram mais consistentes no mobile, itens descartados podem voltar para `Pendente` e compras feitas no dia do fechamento do cartão agora entram na próxima fatura.
- Tipografia e exportações: suporte a `SF Pro` foi removido, a validação de fontes ficou centralizada em `public/fonts/font_index.ts` e as exportações em PDF/CSV/Excel receberam melhor branding e apresentação.
- Calculadora e diálogos: o arraste ficou mais estável, os bloqueios de fechamento externo foram reforçados e o display interno foi reorganizado para uso mais consistente.
- Também houve ajustes menores de responsividade, espaçamento e acabamento visual em telas mobile, modais e detalhes de interface.

## [1.7.6] - 2026-03-02

Esta versão adiciona suporte completo a Passkeys (WebAuthn) via `@better-auth/passkey`: nova aba em `/ajustes` permite listar, adicionar, renomear e remover credenciais, e a tela de login ganhou ação dedicada para passkey. O dashboard ganhou widget de Anotações e atalhos rápidos na toolbar de widgets pra criar Receita, Despesa ou Anotação direto. Top Estabelecimentos foi unificado num único widget com abas, e o widget "Lançamentos recentes" foi substituído por "Progresso de metas" com lista de orçamentos do período (gasto, limite e percentual de uso por categoria).

### Adicionado

- Suporte completo a Passkeys (WebAuthn) com plugin `@better-auth/passkey` no servidor e `passkeyClient` no cliente de autenticação
- Tabela `passkey` no banco de dados para persistência de credenciais WebAuthn vinculadas ao usuário
- Nova aba **Passkeys** em `/ajustes` com gerenciamento de credenciais: listar, adicionar, renomear e remover passkeys
- Ação de login com passkey na tela de autenticação (`/login`)
- Dashboard: botões rápidos na toolbar de widgets para `Nova receita`, `Nova despesa` e `Nova anotação` com abertura direta dos diálogos correspondentes
- Widget de **Anotações** no dashboard com listagem das anotações ativas, ações discretas de editar e ver detalhes, e atalho para `/anotacoes`

### Alterado

- `PasskeysForm` refatorado para melhor experiência com React 19/Next 16: detecção de suporte do navegador, bloqueio de ações simultâneas e atualização da lista sem loader global após operações
- Widget de pagadores no dashboard agora exibe variação percentual em relação ao mês anterior (seta + cor semântica), seguindo o padrão visual dos widgets de categorias
- Dashboard: widgets `Condições de Pagamentos` + `Formas de Pagamento` unificados em um único widget com abas; `Top Estabelecimentos` + `Maiores Gastos do Mês` também unificados em widget com abas
- Relatórios: rota de Top Estabelecimentos consolidada em `/relatorios/estabelecimentos`
- Dashboard: widget `Lançamentos recentes` removido e substituído por `Progresso de metas` com lista de orçamentos do período (gasto, limite configurado e percentual de uso por categoria)
- Dashboard: `fetchDashboardData` deixou de carregar `notificationsSnapshot` (notificações continuam sendo carregadas no layout), reduzindo uma query no carregamento da página inicial

### Corrigido

- Login com passkey na tela de autenticação agora fica disponível em navegadores com WebAuthn, mesmo sem suporte a Conditional UI
- Listagem de passkeys em Ajustes agora trata `createdAt` ausente sem gerar data inválida na interface
- Migração `0017_previous_warstar` tornou-se idempotente para colunas de `preferencias_usuario` com `IF NOT EXISTS`, evitando falha em bancos já migrados

### Removido

- Código legado não utilizado no dashboard: widget e fetcher de `Lançamentos Recentes`
- Componente legado `CategoryCard` em categorias (substituído pelo layout atual em tabela)
- Componente `AuthFooter` não utilizado na autenticação
- Barrel files sem consumo em `components/relatorios`, `components/lancamentos` e `components/lancamentos/shared`
- Rota legada `/top-estabelecimentos` e arquivos auxiliares (`layout.tsx` e `loading.tsx`) removidos

## [1.7.5] - 2026-02-28

Versão pequena de polimento: ações para excluir item individual (processado/descartado) e limpar itens em lote por status na inbox de pré-lançamentos, redesign dos cards e diálogos dos widgets de boletos e faturas com indicação "Atrasado / Pagar" quando vencidos e não pagos, e migração da página de categorias de cards pra layout em tabela com link direto para detalhe e ações inline.

### Adicionado

- Inbox de pré-lançamentos: ações para excluir item individual (processado/descartado) e limpar itens em lote por status

### Alterado

- Página de categorias: layout migrado de cards para tabela com link direto para detalhe, ícone da categoria e ações inline de editar/remover
- Widgets de boletos e faturas no dashboard: cards e diálogos redesenhados, com destaque visual para status e valores
- Estados de vencimento em boletos e faturas: quando vencidos e não pagos, exibem indicação "Atrasado / Pagar"
- Notificações de faturas: exibição de logo do cartão (quando disponível) e atualização dos ícones da listagem

### Corrigido

- `parseDueDate` no widget de faturas agora retorna também a data parseada com fallback seguro (`date: null`) para evitar comparações inválidas
- Formatação do `components/dashboard/invoices-widget.tsx` ajustada para passar no lint

## [1.7.4] - 2026-02-28

Versão de polimento de responsividade no mobile: 26 componentes ajustados (navbar, filtros, skeletons, widgets, dialogs), card de análise de parcelas empilhado verticalmente em telas pequenas e cards do top estabelecimentos reorganizados em coluna única no mobile. Inclui também regra mais inteligente em "Remover selecionados" — quando todos os itens pertencem à mesma série, abre dialog de escopo com 3 opções; e ajuste no consumo de limite por despesa recorrente no cartão (só consome quando a data já passou).

### Alterado

- Card de análise de parcelas (`/dashboard/analise-parcelas`): layout empilhado no mobile — nome/cartão e valores Total/Pendente em linhas separadas ao invés de lado-a-lado, evitando truncamento
- Página de top estabelecimentos (`/top-estabelecimentos`): cards "Top Estabelecimentos por Frequência" e "Principais Categorias" empilhados verticalmente no mobile (`grid-cols-1 lg:grid-cols-2`)
- Padding da lista de parcelas expandida reduzido no mobile (`px-2 sm:px-8`)
- Ajustes gerais de responsividade em navbar, filtros, skeletons, widgets e dialogs (26 componentes)
- Remover selecionados: quando todos os itens selecionados pertencem à mesma série (parcelado ou recorrente), abre dialog de escopo com 3 opções ao invés de confirmação simples (parcial da PR #18)
- Despesa recorrente no cartão de crédito: só consome o limite do cartão quando a data da ocorrência já passou; mesma regra no relatório de cartões (parcial da PR #18)

## [1.7.3] - 2026-02-27

Versão pequena com nova prop `compact` no DatePicker (formato abreviado "28 fev", sem "de" e sem ano) e modal de múltiplos lançamentos reformulado: selects de conta e cartão separados por forma de pagamento, InlinePeriodPicker ao escolher cartão de crédito e DatePicker compacto.

### Adicionado

- Prop `compact` no DatePicker para formato abreviado "28 fev" (sem "de" e sem ano)

### Alterado

- Modal de múltiplos lançamentos reformulado: selects de conta e cartão separados por forma de pagamento, InlinePeriodPicker ao selecionar cartão de crédito, grid full-width, DatePicker compacto
- Opção "Boleto" removida das formas de pagamento no modal de múltiplos lançamentos

## [1.7.2] - 2026-02-26

Versão de polimento dos diálogos: padding maior (p-10), largura padronizada em `max-w-xl` e botões do footer com largura igual; o lançamento dialog ganhou seção colapsável "Condições e anotações" e cálculo automático do período da fatura via `deriveCreditCardPeriod()`. Inclui também uma faxina de tipos (non-null assertions removidas, `any` substituído por tipos explícitos em 15+ arquivos) e remoção de 6 componentes e 20+ funções/tipos sem uso.

### Alterado

- Dialogs padronizados: padding maior (p-10), largura max-w-xl, botões do footer com largura igual (flex-1)
- Lançamento dialog simplificado: período da fatura calculado automaticamente a partir da data de compra + dia de fechamento do cartão via `deriveCreditCardPeriod()`
- Seção "Condições e anotações" colapsável no lançamento dialog
- Mass-add dialog: campo unificado conta/cartão com parsing por prefixo, period picker apenas para cartão de crédito
- PeriodPicker removido dos campos básicos; substituído por InlinePeriodPicker inline no cartão de crédito

### Corrigido

- Non-null assertions (!) substituídas por type assertions ou optional chaining com guards em 15+ arquivos
- `any` substituído por `unknown` ou tipos explícitos (use-form-state, pagadores/data, ajustes/actions, insights/actions)
- Hooks com dependências exaustivas: magnet-lines (useEffect antes de early return), lancamentos-filters (useCallback), inbox-page (useCallback + deps)
- `Error` component renomeado para `ErrorComponent` evitando shadowing do global

### Removido

- 6 componentes não utilizados: dashboard-grid, expenses/income-by-category widgets, installment analysis panels, fatura-warning-dialog
- 20+ funções/tipos não utilizados: successResult, generateApiToken, validateApiToken, getTodayUTC/Local, calculatePercentage, roundToDecimals, safeParseInt/Float, isPeriodValid, getLastPeriods, entre outros
- FaturaWarningDialog e checkFaturaStatusAction (substituídos por derivação automática de período)

## [1.7.1] - 2026-02-24

Esta versão substitui o header lateral por uma topbar de navegação com backdrop blur e links agrupados em 5 seções (Dashboard, Lançamentos, Cartões, Relatórios, Ferramentas), expande o sino de notificações pra exibir orçamentos estourados e pré-lançamentos pendentes em seções separadas, e cria página dedicada de changelog em `/changelog` (acessível pelo menu do usuário com a versão atual exibida ao lado).

### Adicionado

- Topbar de navegação substituindo o header fixo: backdrop blur, links agrupados em 5 seções (Dashboard, Lançamentos, Cartões, Relatórios, Ferramentas)
- Dropdown Ferramentas na topbar consolidando calculadora e modo privacidade
- Sino de notificações expandido: exibe orçamentos estourados e pré-lançamentos pendentes com seções separadas e contagem agregada
- Página dedicada de changelog em `/changelog`
- Link para o changelog no menu do usuário com versão exibida ao lado

### Alterado

- Logo refatorado com variante compacta para uso na topbar
- Menu do usuário incorpora o botão de logout e link para ajustes
- Links da topbar em lowercase; layout centralizado em max-w-8xl
- Data no changelog exibida no formato dd/mm/aaaa

### Removido

- Header lateral substituído pela topbar
- Aba Changelog removida de Ajustes (agora é página própria)
- Componentes separados de logout e modo privacidade (incorporados à topbar)

## [1.6.3] - 2026-02-19

Correção pontual: variável `RESEND_FROM_EMAIL` não era lida corretamente do `.env` quando o valor continha espaços (precisa estar entre aspas). Leitura centralizada em `lib/email/resend.ts` com `getResendFromEmail()` e carregamento explícito do `.env` no contexto de Server Actions.

### Corrigido

- E-mail Resend: variável `RESEND_FROM_EMAIL` não era lida do `.env` (valores com espaço precisam estar entre aspas). Leitura centralizada em `lib/email/resend.ts` com `getResendFromEmail()` e carregamento explícito do `.env` no contexto de Server Actions

### Alterado

- `.env.example`: `RESEND_FROM_EMAIL` com valor entre aspas e comentário para uso em Docker/produção
- `docker-compose.yml`: env do app passa `RESEND_FROM_EMAIL` (em vez de `EMAIL_FROM`) para o container, alinhado ao nome usado pela aplicação

## [1.6.2] - 2026-02-19

Correção pontual no mobile: ao selecionar um logo no diálogo de criação de conta/cartão, o diálogo principal fechava inesperadamente. Adicionado `stopPropagation` nos eventos de click/touch dos botões e delay com `requestAnimationFrame` antes de fechar o seletor.

### Corrigido

- Bug no mobile onde, ao selecionar um logo no diálogo de criação de conta/cartão, o diálogo principal fechava inesperadamente: adicionado `stopPropagation` nos eventos de click/touch dos botões de logo e delay com `requestAnimationFrame` antes de fechar o seletor de logo

## [1.6.1] - 2026-02-18

Versão pequena: nome do estabelecimento padronizado para transferências entre contas ("Saída - Transf. entre contas" e "Entrada - Transf. entre contas") com anotação no formato "de {origem} -> {destino}", e correção de avisos `width(-1) and height(-1)` do `ChartContainer` no console.

### Alterado

- Transferências entre contas: nome do estabelecimento passa a ser "Saída - Transf. entre contas" na saída e "Entrada - Transf. entre contas" na entrada e adicionando em anotação no formato "de {conta origem} -> {conta destino}"
- ChartContainer (Recharts): renderização do gráfico apenas após montagem no cliente e uso de `minWidth`/`minHeight` no ResponsiveContainer para evitar aviso "width(-1) and height(-1)" no console

## [1.6.0] - 2026-02-18

Versão de personalização da tabela de lançamentos. Duas novas preferências em Ajustes > Extrato e lançamentos: "Anotações em coluna" (controla se a anotação aparece como coluna ou tooltip no ícone) e "Ordem das colunas" (lista ordenável por arrasto pra reordenar Estabelecimento, Transação, Valor etc.). Inclui ajustes mobile no header do dashboard (fixo só no mobile) e na rolagem horizontal de tabs e botões de ação.

### Adicionado

- Preferência "Anotações em coluna" em Ajustes > Extrato e lançamentos: quando ativa, a anotação dos lançamentos aparece em coluna na tabela; quando inativa, permanece no balão (tooltip) no ícone
- Preferência "Ordem das colunas" em Ajustes > Extrato e lançamentos: lista ordenável por arraste para definir a ordem das colunas na tabela do extrato e dos lançamentos (Estabelecimento, Transação, Valor, etc.); a linha inteira é arrastável
- Coluna `extrato_note_as_column` e `lancamentos_column_order` na tabela `preferencias_usuario` (migrations 0017 e 0018)
- Constantes e labels das colunas reordenáveis em `lib/lancamentos/column-order.ts`

### Alterado

- Header do dashboard fixo apenas no mobile (`fixed top-0` com `md:static`); conteúdo com `pt-12 md:pt-0` para não ficar sob o header
- Abas da página Ajustes (Preferências, Companion, etc.): no mobile, rolagem horizontal com seta indicando mais opções à direita; scrollbar oculta
- Botões "Novo orçamento" e "Copiar orçamentos do último mês": no mobile, rolagem horizontal  (`h-8`, `text-xs`)
- Botões "Nova Receita", "Nova Despesa" e ícone de múltiplos lançamentos: no mobile, mesma rolagem horizontal + botões menores
- Tabela de lançamentos aplica a ordem de colunas salva nas preferências (extrato, lançamentos, categoria, fatura, pagador)
- Adicionado variavel no docker compose para manter o caminho do volume no compose up/down

**Contribuições:** [Guilherme Bano](https://github.com/Gbano1)

## [1.5.3] - 2026-02-21

Versão focada no painel do pagador (novo card "Status de Pagamento" com totais pagos/pendentes e listagem individual de boletos com data de vencimento, data de pagamento e status), além de SEO completo na landing page (Open Graph, Twitter Card, JSON-LD Schema.org, sitemap.xml e robots.txt) e layout específico com metadados ricos. Imagens da landing convertidas de PNG para WebP para melhor performance.

### Adicionado

- Painel do pagador: card "Status de Pagamento" com totais pagos/pendentes e listagem individual de boletos com data de vencimento, data de pagamento e status
- Funções `fetchPagadorBoletoItems` e `fetchPagadorPaymentStatus` em `lib/pagadores/details.ts`
- SEO completo na landing page: metadata Open Graph, Twitter Card, JSON-LD Schema.org, sitemap.xml (`/app/sitemap.ts`) e robots.txt (`/app/robots.ts`)
- Layout específico da landing page (`app/(landing-page)/layout.tsx`) com metadados ricos

### Corrigido

- Validação obrigatória de categoria, conta e cartão no dialog de lançamento — agora validada no cliente (antes do submit) e no servidor via Zod
- Atributo `lang` do HTML corrigido de `en` para `pt-BR`

### Alterado

- Painel do pagador reorganizado em grid de 3 colunas com cards de Faturas, Boletos e Status de Pagamento
- `PagadorBoletoCard` refatorado para exibir lista de boletos individuais em vez de resumo agregado
- Imagens da landing page convertidas de PNG para WebP (melhora de performance)
- Template de título dinâmico no layout raiz (`%s | OpenMonetis`)

## [1.5.2] - 2026-02-16

Reforma visual da landing page: hero com gradient sutil e tipografia responsiva, dashboard preview sem bordas pra visual mais limpo, seção "Funcionalidades" reorganizada em 6 cards principais + 6 extras compactos, seção "Como usar" com tabs Docker (Recomendado) vs Manual e footer simplificado em 3 colunas. Inclui menu hamburger mobile com Sheet drawer, animações fade-in via Intersection Observer e seção dedicada ao OpenMonetis Companion com screenshots e fluxo de captura.

### Alterado

- Landing page reformulada: visual modernizado, melhor experiência mobile e novas seções
- Hero section com gradient sutil e tipografia responsiva
- Dashboard preview sem bordas para visual mais limpo
- Seção "Funcionalidades" reorganizada em 2 blocos: 6 cards principais + 6 extras compactos
- Seção "Como usar" com tabs Docker (Recomendado) vs Manual
- Footer simplificado com 3 colunas (Projeto, Companion, descrição)
- Métricas de destaque (widgets, self-hosted, stars, forks) entre hero e dashboard preview
- Espaçamento e padding otimizados para mobile em todas as seções

### Adicionado

- Menu hamburger mobile com Sheet drawer (`components/landing/mobile-nav.tsx`)
- Animações de fade-in no scroll via Intersection Observer (`components/landing/animate-on-scroll.tsx`)
- Seção dedicada ao OpenMonetis Companion com screenshot do app, fluxo de captura e bancos suportados
- Galeria "Conheça as telas" com screenshots de Lançamentos, Calendário e Cartões
- Link "Conheça as telas" na navegação (desktop e mobile)
- Componente de tabs para setup (`components/landing/setup-tabs.tsx`)

## [1.5.1] - 2026-02-16

Esta versão renomeia o projeto de **OpenSheets** para **OpenMonetis** em todo o codebase (~40 arquivos: package.json, manifests, layouts, componentes, server actions, emails, Docker, docs e landing page). URLs do repositório atualizados de `opensheets-app` para `openmonetis`, image Docker renomeada para `felipegcoutinho/openmonetis` e logo textual atualizado. Inclui também suporte a multi-domínio via `PUBLIC_DOMAIN` (domínio público serve apenas a landing page, com middleware bloqueando rotas do app).

### Alterado

- Projeto renomeado de **OpenSheets** para **OpenMonetis** em todo o codebase (~40 arquivos): package.json, manifests, layouts, componentes, server actions, emails, Docker, docs e landing page
- URLs do repositório atualizados de `opensheets-app` para `openmonetis`
- Docker image renomeada para `felipegcoutinho/openmonetis`
- Logo textual atualizado (`logo_text.png`)

### Adicionado

- Suporte a multi-domínio via `PUBLIC_DOMAIN`: domínio público serve apenas a landing page (sem botões de login/cadastro, rotas do app bloqueadas pelo middleware)
- Variável de ambiente `PUBLIC_DOMAIN` no `.env.example` com documentação

## [1.5.0] - 2026-02-15

Versão de personalização tipográfica: 13 fontes disponíveis (incluindo SF Pro Display, SF Pro Rounded, Inter, Geist Sans, Roboto, Reddit Sans, JetBrains Mono e outras) configuráveis por usuário tanto pra interface quanto pros valores monetários, com FontProvider que aplica a troca instantaneamente via CSS variables sem necessidade de reload. Fontes Apple SF Pro carregadas localmente com 4 pesos (Regular, Medium, Semibold, Bold) e novas colunas `system_font` e `money_font` na tabela `preferencias_usuario`.

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

Versão focada na inbox de pré-lançamentos: novas abas "Pendentes", "Processados" e "Descartados" (antes só pendentes), logo do cartão/conta exibido automaticamente nos cards via matching por nome do app, pre-fill automático do cartão de crédito ao processar e badges de status com data nos itens já processados/descartados em modo readonly. Cor `--warning` ajustada para melhor contraste (mais alaranjada).

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

Reforma do design system: ~60+ componentes migrados de cores hardcoded do Tailwind (`green-500`, `red-600`, `amber-500`, `blue-500` etc.) pra tokens semânticos (`success`, `destructive`, `warning`, `info`); adicionados novos tokens `--success`, `--warning`, `--info` (com foregrounds) tanto em light quanto dark mode, novas variantes `success` e `info` no Badge, e cores de chart estendidas de 6 para 10. Inclui também correção do bug de invalidação de cache do dashboard que impedia widgets de boleto/fatura de atualizar após pagamento, e fix de scroll em listas Popover+Command (estabelecimento, categorias, filtros) com a prop `modal`.

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

Versão pequena: calculadora arrastável via drag handle no header do dialog, callback `onSelectValue` pra inserir valor diretamente no campo de lançamento, e nova aba "Changelog" em Ajustes com histórico parseado do `CHANGELOG.md`. As páginas de itens ativos e arquivados em Cartões, Contas e Anotações foram unificadas com sistema de tabs (mesmo padrão de Categorias), eliminando rotas separadas e nomenclatura inconsistente.

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

Versão de performance no dashboard: indexes compostos em `lancamentos`, cache cross-request via `unstable_cache` com tag `"dashboard"` e TTL de 120s, e invalidação automática em mutations financeiras via `revalidateTag`. Eliminados ~20 JOINs com a tabela `pagadores` (substituídos por filtro direto via `pagadorId`) e queries consolidadas (income-expense-balance: 12→1 com GROUP BY; payment-status: 2→1; expenses/income por categoria: 4→2). Auth session deduplicada por request via `React.cache()` e scan de métricas limitado a 24 meses.

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

Versão de adaptação ao React 19 compiler: removidos ~60 `useCallback`/`useMemo` desnecessários, wrappers `React.memo` redundantes e simplificação de padrões de hidratação com `useSyncExternalStore`. Sem mudanças visíveis ao usuário — só faxina interna alinhada às novas otimizações automáticas do compilador.

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

Versão pequena: novo widget de pagadores no dashboard com avatares atualizados.

### Adicionado

- Widget de pagadores no dashboard
- Avatares atualizados para pagadores

## [1.2.4] - 2025-01-22

Correção pontual: preservação de formatação nas anotações e ajuste no layout do card de anotações.

### Corrigido

- Preservar formatação nas anotações
- Layout do card de anotações

## [1.2.3] - 2025-01-22

Versão pequena: versão do app passa a aparecer na sidebar e atualização da documentação.

### Adicionado

- Versão exibida na sidebar
- Documentação atualizada

## [1.2.2] - 2025-01-22

Versão de manutenção: atualização de dependências e formatação aplicada em todo o código.

### Alterado

- Atualização de dependências
- Aplicada formatação no código
