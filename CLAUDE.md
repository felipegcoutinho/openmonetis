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
6. **Versionamento**: registrar mudancas no `CHANGELOG.md` seguindo Keep a Changelog.
7. **Comunicacao**: responder em portugues clara e direta com o time.

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
| `pagadores` | `payers` |
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

## Response Style

Quando o time pedir avaliacao de plano ou feature:

1. Responder em portugues simples.
2. Listar 3-5 problemas principais.
3. Fechar com decisao pratica:
   - aprova agora
   - nao aprova agora
   - o que ajustar antes de comecar codigo

Exemplo:

- "Nao aprovaria para comecar codigo imediatamente."
- "Primeiro ajustaria o doc com estes 5 pontos."
