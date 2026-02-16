# AI Coding Assistant Instructions for OpenMonetis

## Project Overview

OpenMonetis is a self-hosted personal finance management application built with Next.js 16, TypeScript, PostgreSQL, and Drizzle ORM. It provides manual transaction tracking, account management, budgeting, and financial insights with a Portuguese interface.

## Architecture

- **Frontend**: Next.js App Router with React 19, shadcn/ui components, Tailwind CSS
- **Backend**: Server actions in Next.js, API routes for auth/health
- **Database**: PostgreSQL with Drizzle ORM, schema in `db/schema.ts`
- **Auth**: Better Auth (OAuth + email magic links)
- **Deployment**: Docker multi-stage build, health checks

## Key Patterns

- **Server Actions**: Use `"use server"` for mutations, validate with Zod schemas, handle errors with `handleActionError`
- **Database Queries**: Use Drizzle's query API with relations, e.g., `db.query.lancamentos.findMany({ with: { categoria: true } })`
- **Authentication**: Import from `lib/auth/server`, redirect on failure
- **Revalidation**: Call `revalidateForEntity("lancamentos")` after mutations
- **Portuguese Naming**: DB fields like `nome`, `tipo_conta`, `pagador` (payer), `lancamento` (transaction)
- **Component Structure**: Feature-based folders in `components/`, shared UI in `components/ui/`

## Development Workflow

- **Start Dev**: `pnpm dev` (Turbopack), `docker compose up db -d` for DB
- **Database**: `pnpm db:push` to sync schema, `pnpm db:studio` for visual editor
- **Build**: `pnpm build`, `pnpm start` for production
- **Docker**: `pnpm docker:up` for full stack, `pnpm docker:logs` for monitoring

## Common Tasks

- **Add Transaction**: Create server action in `app/(dashboard)/lancamentos/actions.ts`, validate with Zod, insert via Drizzle
- **New Entity**: Add to `db/schema.ts`, define relations, create CRUD actions in `lib/[entity]/actions.ts`
- **UI Component**: Use shadcn/ui, place in `components/[feature]/`, export from `components/ui/`
- **API Route**: Add to `app/api/`, use `getUserSession()` for auth

## Conventions

- **Imports**: Absolute paths with `@/`, group by external/internal
- **Error Handling**: Return `{ success: false, error: string }` from actions
- **Currency**: Store as decimal strings (e.g., "123.45"), convert to cents for calculations
- **Periods**: Format as "YYYY-MM", use `parsePeriodParam()` for URL params
- **Notifications**: Send emails via `sendPagadorAutoEmails()` for payer updates

## External Integrations

- **Better Auth**: Config in `lib/auth/config.ts`, session handling
- **Drizzle**: Migrations in `drizzle/`, studio at `pnpm db:studio`
- **AI Features**: Use `@ai-sdk/*` for insights, configured in environment
- **Email**: Resend for notifications, configured via `RESEND_API_KEY`

## File Examples

- Schema: `db/schema.ts` (relations, indexes)
- Actions: `app/(dashboard)/lancamentos/actions.ts` (CRUD with validation)
- Components: `components/lancamentos/page/lancamentos-page.tsx` (client component)
- Utils: `lib/lancamentos/page-helpers.ts` (data transformation)
