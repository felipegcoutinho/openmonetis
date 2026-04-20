# CLAUDE.md - OpenMonetis

> Self-hosted personal finance app (Next.js 16, React 19, PostgreSQL, Drizzle ORM, Better Auth, Tailwind 4, shadcn/ui).
> Portuguese UI, English folders/imports. Linter: Biome 2.x. Package manager: pnpm.

## Related Projects

- **OpenMonetis Companion** (`~/github/openmonetis-companion`): Android app que captura notificacoes de apps bancarios e envia para o OpenMonetis via API. Os itens chegam na feature `inbox` para revisao.

---

## Critical Rules

1. **Sempre filtrar por `userId`** em queries.
2. **Usar `getAdminPayerId(userId)`** de `src/shared/lib/payers/get-admin-id.ts` ao inves de JOIN com `payers` para descobrir o admin.
3. **Periods** usam formato `YYYY-MM` (ex: `"2025-11"`). Utils em `src/shared/utils/period/`.
4. **Moeda**: R$ com 2 decimais. DB: `numeric(12, 2)`. Utils em `src/shared/utils/currency.ts`.
5. **Revalidation**: usar `revalidateForEntity("entity")` de `src/shared/lib/actions/helpers.ts` apos mutations.
6. **Versionamento**: registrar mudancas no `CHANGELOG.md` seguindo Keep a Changelog, também altere o `package.json` e `readme.md` (Badges do README.md). Cada versão deve ter um parágrafo introdutório em linguagem humana logo abaixo do cabeçalho `## [x.y.z]`, antes das seções `### Adicionado/Alterado/Removido` — descrevendo em prosa o que a versão representa (ex: "Esta versão foca em polimento visual e reorganização interna...").
7. **Comunicacao**: responder em portugues clara e direta com o time.
8. **Commit messages**: agrupar por natureza. em pt-br. seguindo o padrao do sistema.
9. **README.md**: sempre que fizer alteracoes significativas, atualize o README.md.

---

## Architecture

### Feature-First

- `src/app/`: roteamento, layouts, loading states e paginas finas
- `src/features/`: codigo de dominio por feature
- `src/shared/`: tudo que e genuinamente reutilizado entre features
- `src/db/`: schema do banco

### Regra Feature vs Shared

Use esta pergunta:

> Se eu deletar esta feature, este arquivo deveria sumir junto?

- Sim: vai para `src/features/<feature>/`
- Nao: vai para `src/shared/`

### Features nao importam outras features

Se um contrato cruza dominios, ele deve morar em `src/shared/`.

**Excecao intencional: `attachments` depende de `transactions`**

`src/features/attachments` importa `TransactionDialog`, `TransactionDetailsDialog` e `TransactionItem` diretamente de `src/features/transactions`. Isso e uma dependencia explicita e aceita: anexos sao semanticamente uma extensao de lancamentos — existem por causa deles e nao fazem sentido sem esse contexto. Mover esses componentes para `shared/` seria errado (eles pertencem a transactions). Nao tratar isso como bug a corrigir.

Exemplos comuns:

- auth: `src/shared/lib/auth/*`
- db: `src/shared/lib/db.ts`
- revalidation helpers: `src/shared/lib/actions/*`
- payers cross-domain helpers: `src/shared/lib/payers/*`
- period/currency/date: `src/shared/utils/*`
- shadcn/ui: `src/shared/components/ui/*`

---

## Directory Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── cards/
│   │   │   └── [cardId]/invoice/
│   │   ├── accounts/
│   │   │   └── [accountId]/statement/
│   │   ├── categories/
│   │   │   ├── [categoryId]/
│   │   │   └── history/
│   │   ├── budgets/
│   │   ├── payers/
│   │   │   └── [payerId]/
│   │   ├── notes/
│   │   ├── insights/
│   │   ├── calendar/
│   │   ├── inbox/
│   │   ├── attachments/
│   │   ├── changelog/
│   │   ├── reports/
│   │   │   ├── category-trends/
│   │   │   ├── card-usage/
│   │   │   ├── installment-analysis/
│   │   │   └── establishments/
│   │   └── settings/
│   ├── (landing-page)/
│   ├── api/
│   ├── globals.css
│   └── layout.tsx
├── features/
│   ├── auth/
│   ├── landing/
│   ├── dashboard/
│   ├── transactions/
│   ├── cards/
│   ├── invoices/
│   ├── accounts/
│   ├── categories/
│   ├── budgets/
│   ├── payers/
│   ├── notes/
│   ├── insights/
│   ├── calendar/
│   ├── inbox/
│   ├── attachments/
│   ├── reports/
│   └── settings/
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   ├── providers/
│   │   ├── month-picker/
│   │   ├── logo-picker/
│   │   ├── calculator/
│   │   ├── entity-avatar/
│   │   └── skeletons/
│   ├── hooks/
│   ├── lib/
│   │   ├── actions/
│   │   ├── auth/
│   │   ├── accounts/
│   │   ├── cards/
│   │   ├── calculator/
│   │   ├── categories/
│   │   ├── email/
│   │   ├── installments/
│   │   ├── invoices/
│   │   ├── logo/
│   │   ├── payers/
│   │   ├── schemas/
│   │   ├── transfers/
│   │   ├── types/
│   │   └── db.ts
│   └── utils/
│       ├── period/
│       ├── currency.ts
│       ├── date.ts
│       ├── financial-dates.ts
│       ├── percentage.ts
│       ├── category-colors.ts
│       ├── calendar.ts
│       ├── math.ts
│       ├── number.ts
│       ├── string.ts
│       ├── initials.ts
│       ├── icons.tsx
│       ├── export-branding.ts
│       ├── ui.ts
│       └── calculator.ts
└── db/
    └── schema.ts
```

---

## Import Patterns

### Preferidos

```ts
import { getUser } from "@/shared/lib/auth/server";
import { revalidateForEntity } from "@/shared/lib/actions/helpers";
import { parsePeriodParam } from "@/shared/utils/period";
import { TransactionsPage } from "@/features/transactions/components/page/transactions-page";
import { fetchLancamentos } from "@/features/transactions/queries";
```

### Evitar

```ts
import { Something } from "@/components/...";
import { Something } from "@/lib/...";
import { something } from "@/app/(dashboard)/...";
```

---

## App Router Pattern

Paginas em `src/app/` devem ser finas:

```ts
import { getUser } from "@/shared/lib/auth/server";
import { TransactionsPage } from "@/features/transactions/components/page/transactions-page";
import { fetchLancamentos } from "@/features/transactions/queries";

export default async function Page() {
  const user = await getUser();
  const data = await fetchLancamentos([/* filters */]);
  return <TransactionsPage {...data} />;
}
```

Layouts, `loading.tsx` e metadata continuam em `src/app/`.

---

## Naming

### Routes / folders

| Portugues | English |
|---|---|
| `lancamentos` | `transactions` |
| `cartoes` | `cards` |
| `contas` | `accounts` |
| `categorias` | `categories` |
| `orcamentos` | `budgets` |
| `pessoas` | `payers` |

> **Nota:** o conceito de "pagador" foi renomeado para **"pessoa"** na UI (labels, toasts, textos visíveis ao usuário). O código, rotas e schema continuam usando o termo original em inglês (`payer`, `payerId`, `adminPayerId`) e em português interno (`pagador` como variável). Não renomear esses identificadores — a divergência entre UI e código é intencional e documentada.
| `anotacoes` | `notes` |
| `calendario` | `calendar` |
| `ajustes` | `settings` |
| `pre-lancamentos` | `inbox` |
| `relatorios/tendencias` | `reports/category-trends` |
| `relatorios/uso-cartoes` | `reports/card-usage` |
| `relatorios/analise-parcelas` | `reports/installment-analysis` |
| `relatorios/estabelecimentos` | `reports/establishments` |
| `contas/[contaId]/extrato` | `accounts/[accountId]/statement` |
| `cartoes/[cartaoId]/fatura` | `cards/[cardId]/invoice` |
| `categorias/historico` | `categories/history` |
| `changelog` | `settings/changelog` |

### Files

- preferir `kebab-case`
- preferir nomes em ingles
- manter nomes internos de tipos/funcoes somente quando a troca aumentar risco sem ganho real

---

## Commands

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run lint:fix
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run db:generate
pnpm run db:push
pnpm run db:studio
pnpm run docker:up:db
```

---

## Revalidation

Arquivo: `src/shared/lib/actions/helpers.ts`

- atualizar sempre os paths em ingles
- lembrar de manter a tag `"dashboard"` para invalidacoes financeiras

---

## Auth

- `getUser()` / `getUserId()` em `src/shared/lib/auth/server.ts`
- sessao deduplicada por request com `React.cache()`

---

## Dashboard Fetcher

Padrao recomendado:

```ts
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";

export async function fetchData(userId: string, period: string) {
  const adminPayerId = await getAdminPayerId(userId);
  if (!adminPayerId) return [];

  return db.query.transactions.findMany({
    where: /* sempre com userId + adminPayerId + period */,
  });
}
```

---

## New Feature Checklist

1. Criar a rota fina em `src/app/(dashboard)/<feature>/page.tsx`
2. Criar a feature em `src/features/<feature>/`
3. Separar:
   - `components/`
   - `queries.ts`
   - `actions.ts`
   - `types.ts` ou `schemas.ts` quando fizer sentido
4. Extrair para `src/shared/` tudo que for reutilizavel
5. Atualizar navegacao e `revalidateForEntity()` se a feature tiver CRUD
6. Rodar:
   - `pnpm exec next typegen`
   - `pnpm exec tsc --noEmit`
   - `pnpm run lint`

---

## Security Rules

Regras aplicadas automaticamente ao gerar codigo.

### Secrets
Nunca colocar API keys, credenciais de banco ou tokens em codigo frontend. Evitar variaveis prefixadas com `NEXT_PUBLIC_` para dados sensiveis — estas sao bundladas no cliente. Usar variaveis server-side apenas. `.env` deve estar no `.gitignore` antes do primeiro commit. `.env.example` deve ter apenas placeholders.

### Autenticacao & Autorizacao
Toda rota protegida em `src/app/api/` requer `getUser()` ou `getOptionalUserSession()` antes de qualquer logica, retornando 401 para nao autenticados. Rotas com IDs de recursos devem verificar ownership: `eq(table.userId, userId)`. Rotas admin devem checar role e retornar 403 para nao-admins. Session cookies em Better Auth ja tem `httpOnly`, `secure` e `sameSite` configurados — nao alterar.

### Input & Output
Usar Drizzle ORM (parametrizado por padrao) — nunca concatenar input de usuario em SQL. Validar todo input com Zod antes de usar. Upload de arquivos: usar whitelist de MIME types (`ALLOWED_MIME_TYPES`), presigned URLs para S3, token de upload assinado com verificacao pos-upload. Nunca usar `dangerouslySetInnerHTML` com conteudo de usuario.

### Headers & CSP
CSP definida em `src/proxy.ts` via middleware — alterar la, nao em `next.config.ts`. Headers de seguranca (HSTS, X-Frame-Options, etc.) definidos em `next.config.ts`. Nao remover nem enfraquecer essas configuracoes.

### Rate Limiting
Login: 5 tentativas/min. Signup: 3 tentativas/min. API tokens: 100 req/min (inbox), 20 req/min (batch). Configurado em `src/shared/lib/auth/config.ts` e nas rotas de inbox. Nao remover.

### Tratamento de Erros
Erros nao devem expor stack traces, paths ou nomes de bibliotecas ao cliente. Usar mensagens genericas: `"Algo deu errado"`. Logar detalhes apenas no servidor com `console.error()`.

### Dependencias
Verificar pacotes novos sugeridos pela IA em npmjs.com antes de instalar. Red flags: menos de 1.000 downloads/semana, publicado nos ultimos 30 dias, nome muito parecido com pacote popular. Rodar `pnpm audit` periodicamente.

---
