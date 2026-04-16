# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [2.4.0] - 2026-04-13

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

### Alterado

- Docker: `docker-compose.yml` refatorado — removidos profiles, build e dependência de arquivo externo; compose agora é standalone (basta `curl` + `docker compose up -d`)
- Docker: `docker-entrypoint.sh` simplificado — extensão `pgcrypto` criada via Node.js antes das migrations; loop de retry reescrito; removido hack `@localhost → @db`
- Docker: scripts reduzidos de 10 para 5 — `docker:up`, `docker:db`, `docker:down`, `docker:logs`, `docker:update`
- Docs: README reestruturado em dois perfis claros — **Usar** (só Docker) e **Desenvolver** (hot-reload)

## [2.3.7] - 2026-04-11

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

### Corrigido

- Docker: adicionado `NODE_PATH=/app/migrate/node_modules` no entrypoint para que o `drizzle-kit` consiga resolver `drizzle-orm` ao executar as migrations no container

## [2.3.5] - 2026-04-07

### Corrigido

- CSP: movido `Content-Security-Policy` do `next.config.ts` (build time) para `proxy.ts` (runtime), corrigindo bloqueio de upload de anexos quando `S3_ENDPOINT` não estava disponível durante o build do Docker

## [2.3.4] - 2026-04-05

### Corrigido

- Anexos: corrigido upload que falhava com `NetworkError` — CSP `connect-src` bloqueava fetch para o Storage

## [2.3.3] - 2026-04-05

### Corrigido

- Tokens: corrigido `/api/auth/device/verify` que rejeitava tokens criados via Settings (revertido de JWT para hash lookup)

### Alterado

- Tokens: prefixo renomeado de `os_` para `opm_` (OpenMonetis); tokens existentes precisam ser recriados
- Tokens: removidas rotas JWT não utilizadas (`/api/auth/device/token` e `/api/auth/device/refresh`)
- Tokens: `api-token.ts` simplificado para conter apenas `hashToken` e `extractBearerToken`

## [2.3.2] - 2026-04-04

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

### Corrigido

- Infraestrutura: deps do drizzle-kit agora são instaladas em `/app/migrate/` separado do `node_modules` do standalone, corrigindo erro `Cannot find module 'next'` no startup do container

## [2.3.0] - 2026-04-03

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

### Corrigido

- Docker: imagem de produção deixa de executar `chown -R /app` no stage final; as permissões passam a ser definidas nos `COPY --chown`, reduzindo o risco de travamento e lentidão excessiva no build/push da GitHub Action

## [2.2.0] - 2026-04-01

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

### Adicionado

- Lançamentos: suporte a anexos em transações com upload direto para storage compatível com S3, persistência em tabelas dedicadas (`anexos` e `lancamento_anexos`) e ações de visualizar/remover no detalhe do lançamento
- Infraestrutura: novo workflow `.github/workflows/release.yml` para criar tag e GitHub Release automaticamente a partir da versão do `package.json` e da entrada correspondente no `CHANGELOG.md`

### Alterado

- Anexos: upload agora exige token assinado por arquivo, valida propriedade da transação também na leitura/remoção e confere tamanho/tipo do objeto no storage antes de persistir o vínculo no banco

### Corrigido

- Lançamentos: criação de transações no cartão de crédito agora bloqueia períodos cujas faturas já estão pagas, evitando divergência no relatório de análise de parcelas

## [2.0.3] - 2026-03-26

### Corrigido

- Lançamentos: `/transactions` deixa de depender de `crypto.randomUUID()` no carregamento inicial, corrigindo a falha em ambientes self-hosted sem HTTPS ao abrir a página

## [2.0.2] - 2026-03-25

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

### Corrigido

- Inbox: filtro por app em `/inbox` agora monta a lista completa de apps da aba a partir de todos os itens do status atual, sem depender apenas da página carregada, e o SSR deixa de quebrar quando `sourceApps` vier inconsistente
- Inbox: notificações de cartões/apps sem logo cadastrado agora exibem `default_icon.png` como fallback visual nos cards
- Inbox: select de apps em `/inbox` agora exibe os logos dos apps/cartões, com fallback para `default_icon.png` quando não houver logo mapeado
- Inbox: cabeçalhos de data entre grupos de cards agora exibem ícone e tipografia um pouco maior para melhorar a leitura
- Versionamento: `/api/health` passa a reportar a versão atual do `package.json`, evitando divergência entre healthcheck, UI e release publicada

## [2.0.0] - 2026-03-21

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

### Alterado

- Card de análise de parcelas (`/dashboard/analise-parcelas`): layout empilhado no mobile — nome/cartão e valores Total/Pendente em linhas separadas ao invés de lado-a-lado, evitando truncamento
- Página de top estabelecimentos (`/top-estabelecimentos`): cards "Top Estabelecimentos por Frequência" e "Principais Categorias" empilhados verticalmente no mobile (`grid-cols-1 lg:grid-cols-2`)
- Padding da lista de parcelas expandida reduzido no mobile (`px-2 sm:px-8`)
- Ajustes gerais de responsividade em navbar, filtros, skeletons, widgets e dialogs (26 componentes)
- Remover selecionados: quando todos os itens selecionados pertencem à mesma série (parcelado ou recorrente), abre dialog de escopo com 3 opções ao invés de confirmação simples (parcial da PR #18)
- Despesa recorrente no cartão de crédito: só consome o limite do cartão quando a data da ocorrência já passou; mesma regra no relatório de cartões (parcial da PR #18)

## [1.7.3] - 2026-02-27

### Adicionado

- Prop `compact` no DatePicker para formato abreviado "28 fev" (sem "de" e sem ano)

### Alterado

- Modal de múltiplos lançamentos reformulado: selects de conta e cartão separados por forma de pagamento, InlinePeriodPicker ao selecionar cartão de crédito, grid full-width, DatePicker compacto
- Opção "Boleto" removida das formas de pagamento no modal de múltiplos lançamentos

## [1.7.2] - 2026-02-26

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

### Corrigido

- E-mail Resend: variável `RESEND_FROM_EMAIL` não era lida do `.env` (valores com espaço precisam estar entre aspas). Leitura centralizada em `lib/email/resend.ts` com `getResendFromEmail()` e carregamento explícito do `.env` no contexto de Server Actions

### Alterado

- `.env.example`: `RESEND_FROM_EMAIL` com valor entre aspas e comentário para uso em Docker/produção
- `docker-compose.yml`: env do app passa `RESEND_FROM_EMAIL` (em vez de `EMAIL_FROM`) para o container, alinhado ao nome usado pela aplicação

## [1.6.2] - 2026-02-19

### Corrigido

- Bug no mobile onde, ao selecionar um logo no diálogo de criação de conta/cartão, o diálogo principal fechava inesperadamente: adicionado `stopPropagation` nos eventos de click/touch dos botões de logo e delay com `requestAnimationFrame` antes de fechar o seletor de logo

## [1.6.1] - 2026-02-18

### Alterado

- Transferências entre contas: nome do estabelecimento passa a ser "Saída - Transf. entre contas" na saída e "Entrada - Transf. entre contas" na entrada e adicionando em anotação no formato "de {conta origem} -> {conta destino}"
- ChartContainer (Recharts): renderização do gráfico apenas após montagem no cliente e uso de `minWidth`/`minHeight` no ResponsiveContainer para evitar aviso "width(-1) and height(-1)" no console

## [1.6.0] - 2026-02-18

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
