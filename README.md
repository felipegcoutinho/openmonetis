<p align="center">
  <img src="./public/logo_small.png" alt="OpenMonetis Logo" height="80" />
</p>

<p align="center">
  Projeto pessoal de gestão financeira. Self-hosted, manual e open source.
</p>

> **📢 Este projeto foi renomeado de OpenSheets para OpenMonetis.** Se você conhecia o projeto pelo nome anterior, é o mesmo — só mudou o nome!

> **⚠️ Não há versão online hospedada.** Você precisa clonar o repositório e rodar localmente ou no seu próprio servidor.

[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![Android Companion](https://img.shields.io/badge/Companion-Android-3DDC84?style=flat-square&logo=android)](https://github.com/felipegcoutinho/openmonetis-companion)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-orange?style=flat-square&logo=creative-commons)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-ea4aaa?style=flat-square&logo=github-sponsors)](https://github.com/sponsors/felipegcoutinho)

---

<p align="center">
  <img src="./public/dashboard-preview-light.png" alt="Dashboard Preview" width="800" />
</p>

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Início Rápido](#-início-rápido)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Docker](#-docker)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Arquitetura](#-arquitetura)
- [Contribuindo](#-contribuindo)
- [Apoie o Projeto](#-apoie-o-projeto)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

**OpenMonetis** é um projeto pessoal de gestão financeira que criei para organizar minhas próprias finanças. Cansei de usar planilhas desorganizadas e aplicativos que não fazem exatamente o que preciso, então decidi construir algo do jeito que funciona pra mim.

A ideia é simples: ter um lugar onde consigo ver todas as minhas contas, cartões, gastos e receitas de forma clara. Se isso for útil pra você também, fique à vontade para usar e contribuir.

> 💡 **Licença Não-Comercial:** Este projeto é gratuito para uso pessoal, mas não pode ser usado comercialmente. Veja mais detalhes na seção [Licença](#-licença).

### ⚠️ Avisos importantes

**1. Não há versão hospedada online** — Este projeto é self-hosted. Você precisa rodar no seu próprio computador ou servidor.

**2. Não há Open Finance** — Você precisa registrar manualmente suas transações.

**3. Requer disciplina** — O OpenMonetis funciona melhor para quem tem disciplina de registrar os gastos regularmente, quer controle total sobre seus dados e gosta de entender exatamente onde o dinheiro está indo.

### Funcionalidades

💰 **Contas e transações** — Contas bancárias, cartões, dinheiro. Receitas, despesas e transferências. Categorização, extratos detalhados e importação em massa.

📊 **Dashboard e relatórios** — 20+ widgets interativos, gráficos de evolução, comparativos por categoria, tendências, uso de cartões, top estabelecimentos. Exportação em PDF e Excel.

💳 **Faturas de cartão** — Acompanhe faturas por período, controle limites e vencimentos.

🎯 **Orçamentos** — Defina limites por categoria e acompanhe o progresso.

💸 **Parcelamentos avançados** — Séries de parcelas, antecipação com cálculo de desconto, análise consolidada.

🤖 **Insights com IA** — Análises geradas por Claude, GPT, Gemini ou OpenRouter. Insights personalizados e histórico salvo.

👥 **Gestão colaborativa** — Pagadores com permissões (admin/viewer), notificações automáticas por e-mail, códigos de compartilhamento.

📝 **Anotações e tarefas** — Notas de texto, listas com checkboxes, sistema de arquivamento.

📅 **Calendário financeiro** — Visualize todos os lançamentos em um calendário mensal.

📲 **OpenMonetis Companion** — App Android que captura notificações bancárias (Nubank, Itaú, Bradesco, Inter, C6 e outros) e envia como pré-lançamentos para revisão. [Repositório](https://github.com/felipegcoutinho/openmonetis-companion).

⚙️ **Personalização** — Tema dark/light, modo privacidade, fontes customizáveis, preferências por usuário.

### Stack técnica

- **Next.js** (App Router, Turbopack) + **React** + **TypeScript**
- **PostgreSQL** + **Drizzle ORM**
- **Better Auth** (email/senha + OAuth)
- **shadcn/ui** (Radix UI) + **Tailwind CSS**
- **Docker** (multi-stage build)
- **Biome** (linting + formatting)
- **Vercel AI SDK** (Claude, GPT, Gemini, OpenRouter)

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 22+ e pnpm
- Docker e Docker Compose

### Passo a Passo

1. **Clone e instale**

   ```bash
   git clone https://github.com/felipegcoutinho/openmonetis.git
   cd openmonetis
   pnpm install
   ```

2. **Configure o `.env`**

   ```bash
   cp .env.example .env
   ```

   Edite o `.env` com suas credenciais. O principal é o `DATABASE_URL` e o `BETTER_AUTH_SECRET`:

   ```env
   # Banco local (Docker): use host "localhost"
   DATABASE_URL=postgresql://openmonetis:openmonetis_dev_password@localhost:5432/openmonetis_db

   # Banco remoto (Supabase, Neon, etc): use a URL completa do provider
   # DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

   BETTER_AUTH_SECRET=seu-secret-aqui  # gere com: openssl rand -base64 32
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Suba o banco de dados** (pule se estiver usando banco remoto)

   ```bash
   docker compose up db -d
   pnpm db:enableExtensions
   ```

4. **Execute as migrations e inicie**

   ```bash
   pnpm db:push
   pnpm dev
   ```

5. Acesse `http://localhost:3000`

> **Docker completo** (app + banco em containers): use `pnpm docker:up` ao invés dos passos 3-4.

---

## 📜 Scripts Disponíveis

### Desenvolvimento

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Build de produção
pnpm start            # Servidor de produção
pnpm lint             # Biome check
pnpm lint:fix         # Biome auto-fix
```

### Banco de Dados

```bash
pnpm db:generate      # Gerar migrations
pnpm db:migrate       # Executar migrations
pnpm db:push          # Push schema direto (dev)
pnpm db:studio        # Drizzle Studio (UI visual)
```

### Docker

```bash
pnpm docker:up        # Subir app + banco
pnpm docker:up:d      # Subir em background
pnpm docker:up:db     # Subir apenas o banco
pnpm docker:down      # Parar containers
pnpm docker:down:volumes  # Parar e remover volumes (⚠️ apaga dados!)
pnpm docker:logs      # Logs em tempo real
pnpm docker:restart   # Reiniciar
pnpm docker:rebuild   # Rebuild completo
```

---

## 🐳 Docker

O `Dockerfile` usa multi-stage build (deps → builder → runner) com imagem final ~200MB rodando como usuário não-root.

Health checks configurados para ambos os serviços (PostgreSQL via `pg_isready`, app via `GET /api/health`).

### Comandos úteis

```bash
docker compose exec app sh                                      # Shell da aplicação
docker compose exec db psql -U openmonetis -d openmonetis_db    # Shell do banco
docker compose ps                                                # Status
docker compose exec db pg_dump -U openmonetis openmonetis_db > backup.sql  # Backup
docker compose exec -T db psql -U openmonetis -d openmonetis_db < backup.sql  # Restore
```

### Customizando Portas

```env
APP_PORT=3001   # Padrão: 3000
DB_PORT=5433    # Padrão: 5432
```

---

## 🔐 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

### Obrigatórias

```env
DATABASE_URL=postgresql://openmonetis:openmonetis_dev_password@localhost:5432/openmonetis_db
BETTER_AUTH_SECRET=seu-secret-aqui    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```

### Opcionais

```env
# PostgreSQL (Docker local)
POSTGRES_USER=openmonetis
POSTGRES_PASSWORD=openmonetis_dev_password
POSTGRES_DB=openmonetis_db

# Multi-domínio (landing-only no domínio público)
# PUBLIC_DOMAIN=openmonetis.com

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# AI Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
OPENROUTER_API_KEY=
```

---

## 🏗️ Arquitetura

```
openmonetis/
├── app/                           # Next.js App Router
│   ├── api/                       # API Routes (auth, health, inbox)
│   ├── (auth)/                    # Login e cadastro
│   ├── (dashboard)/               # Rotas protegidas
│   └── (landing-page)/            # Página inicial pública
│
├── components/                    # React Components (~200 arquivos)
│   ├── ui/                        # shadcn/ui (40+ componentes)
│   ├── dashboard/                 # Widgets do dashboard (20+)
│   └── [feature]/                 # Componentes por feature
│
├── lib/                           # Lógica de negócio
│   ├── auth/                      # Auth helpers
│   ├── dashboard/                 # Fetchers do dashboard
│   ├── actions/                   # Server Actions helpers
│   ├── schemas/                   # Zod schemas
│   └── utils/                     # Currency, date, period utils
│
├── db/schema.ts                   # Drizzle schema
├── hooks/                         # React hooks customizados
├── public/                        # Assets estáticos
├── scripts/                       # Scripts utilitários
├── Dockerfile                     # Multi-stage build
├── docker-compose.yml             # Orquestração
└── proxy.ts                       # Middleware (auth + multi-domínio)
```

---

## 🤝 Contribuindo

1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/openmonetis.git`
3. **Crie uma branch:** `git checkout -b feature/minha-feature`
4. **Commit:** `git commit -m 'feat: adiciona minha feature'`
5. **Push:** `git push origin feature/minha-feature`
6. Abra um **Pull Request**

Use TypeScript, commits semânticos e documente features novas.

---

## 💖 Apoie o Projeto

Se o **OpenMonetis** está sendo útil, considere se tornar um sponsor!

[![Sponsor no GitHub](https://img.shields.io/badge/Sponsor_no_GitHub-❤️-ea4aaa?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/felipegcoutinho)

Outras formas de contribuir: ⭐ estrela no repo, reportar bugs, melhorar docs, submeter PRs.

---

## 📄 Licença

**Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International** (CC BY-NC-SA 4.0).

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

- ✅ Uso pessoal, modificação, distribuição e fork
- ❌ Uso comercial, remoção de créditos, mudança de licença
- 📋 Crédito ao autor, indicar modificações, mesma licença

Para o texto legal completo, consulte o arquivo [LICENSE](LICENSE) ou visite [creativecommons.org](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt).

---

## 🙏 Agradecimentos

[Next.js](https://nextjs.org/) · [Better Auth](https://better-auth.com/) · [Drizzle ORM](https://orm.drizzle.team/) · [shadcn/ui](https://ui.shadcn.com/) · [Biome](https://biomejs.dev/) · [Vercel](https://vercel.com/)

---

**Desenvolvido por:** Felipe Coutinho — [@felipegcoutinho](https://github.com/felipegcoutinho)

<div align="center">

**⭐ Se este projeto foi útil pra você:**

Dê uma estrela · [Apoie como sponsor](https://github.com/sponsors/felipegcoutinho) · Compartilhe

</div>
