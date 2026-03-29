<p align="center">
  <img src="./public/images/logo_small.png" alt="OpenMonetis Logo" height="80" />
</p>

<p align="center">
  Projeto pessoal de gestão financeira. Self-hosted, manual e open source.
</p>

> **⚠️ Não há versão online hospedada.** Você precisa clonar o repositório e rodar localmente ou no seu próprio servidor.

[![Version](https://img.shields.io/badge/version-2.1.0-blue?style=flat-square)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![Android Companion](https://img.shields.io/badge/Companion-Android-3DDC84?style=flat-square&logo=android)](https://github.com/felipegcoutinho/openmonetis-companion)
[![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-orange?style=flat-square&logo=creative-commons)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-ea4aaa?style=flat-square&logo=github-sponsors)](https://github.com/sponsors/felipegcoutinho)

---

<p align="center">
  <img src="./public/images/dashboard-preview-light.webp" alt="Dashboard Preview" width="800" />
</p>

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Instalação via Script](#-instalação-via-script)
- [Início Rápido (manual)](#-início-rápido)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Docker](#-docker)
- [Storage S3 Compatível](#-storage-s3-compatível)
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

**2. Não há Open Finance** — Não há conexão automática com bancos. Você pode registrar transações manualmente ou importar extratos nos formatos OFX e XLS/XLSX.

**3. Requer disciplina** — O OpenMonetis funciona melhor para quem tem disciplina de registrar os gastos regularmente, quer controle total sobre seus dados e gosta de entender exatamente onde o dinheiro está indo.

### Funcionalidades

💰 **Contas e transações** — Contas bancárias, cartões, dinheiro. Receitas, despesas e transferências. Categorização, extratos detalhados e importação de extratos OFX e XLS/XLSX com detecção automática de categoria.

📊 **Dashboard e relatórios** — Widgets interativos de métricas, gráficos de evolução, comparativos por categoria, tendências, uso de cartões, top estabelecimentos. Exportação em PDF e Excel.

💳 **Faturas de cartão** — Acompanhe faturas por período, controle limites e vencimentos.

🎯 **Orçamentos** — Defina limites por categoria e acompanhe o progresso.

💸 **Parcelamentos avançados** — Séries de parcelas, antecipação com cálculo de desconto, análise consolidada.

🤖 **Insights com IA** — Análises geradas por Claude, GPT, Gemini ou OpenRouter. Insights personalizados e histórico salvo.

👥 **Gestão colaborativa** — Pagadores com permissões (admin/viewer), notificações automáticas por e-mail, códigos de compartilhamento.

📝 **Anotações e tarefas** — Notas de texto, listas com checkboxes, sistema de arquivamento.

📅 **Calendário financeiro** — Visualize todos os lançamentos em um calendário mensal.

📲 **OpenMonetis Companion** — App Android que captura notificações bancárias (Nubank, Itaú, Bradesco, Inter, C6 e outros) e envia como pré-lançamentos para revisão. [Repositório](https://github.com/felipegcoutinho/openmonetis-companion).

⚙️ **Personalização** — Tema dark/light e modo privacidade.

### Stack técnica

- **Next.js** (App Router, Turbopack) + **React** + **TypeScript**
- **PostgreSQL** + **Drizzle ORM**
- **Better Auth** (email/senha, OAuth, Passkeys/WebAuthn)
- **shadcn/ui** (Radix UI) + **Tailwind CSS**
- **Docker** (multi-stage build)
- **Biome** (linting + formatting)
- **Vercel AI SDK** (Claude, GPT, Gemini, OpenRouter)

---

## ⚡ Instalação via Script

A forma mais rápida de instalar. O script verifica dependências, configura o `.env` interativamente e sobe o banco automaticamente.

**Pré-requisito:** Node.js 22+

```bash
# Mac / Linux / WSL
curl -fsSL https://raw.githubusercontent.com/felipegcoutinho/openmonetis/main/setup.mjs -o setup.mjs && node setup.mjs

# Windows (PowerShell)
curl -o setup.mjs https://raw.githubusercontent.com/felipegcoutinho/openmonetis/main/setup.mjs ; node setup.mjs
```

O script irá:
- Verificar Node, pnpm, Git e Docker
- Perguntar se quer banco local (Docker) ou remoto (Supabase, Neon, etc.)
- Gerar o `BETTER_AUTH_SECRET` automaticamente
- Configurar opcionais: Google OAuth, e-mail, IA, domínio público
- Clonar o repositório, instalar dependências e aplicar o schema

---

## 🚀 Início Rápido (manual)

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
   pnpm db:extensions
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

### Utilitários

```bash
pnpm backup           # Backup do banco (requer scripts/backup.sh configurado)
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

## ☁️ Storage S3 Compatível

O suporte a anexos de lançamentos usa upload direto com URL pré-assinada. Essa configuração é opcional, mas passa a ser necessária se você quiser habilitar anexos no app.

### Variáveis

```env
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
```

### Compatibilidade

- O código atual espera um provider com API compatível com S3 e suporte a `PutObject`, `GetObject`, `HeadObject`, `DeleteObject` e URLs pré-assinadas.
- A implementação usa `endpoint` customizado e `forcePathStyle: true` em [`src/shared/lib/storage/s3-client.ts`](/home/ubuntu/github/openmonetis/src/shared/lib/storage/s3-client.ts).
- Em geral isso cobre MinIO, Cloudflare R2, Backblaze B2 S3-Compatible, DigitalOcean Spaces e AWS S3. Mas foi testado apenas no Supabase Storage.
- Se o seu provider exigir `virtual-hosted-style` em vez de `path-style`, você vai precisar ajustar essa configuração antes de usar anexos.
- Se as variáveis de S3 não forem configuradas, mantenha os anexos desabilitados no seu fluxo de uso.

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

# S3 Server (opcional, necessario para anexos)
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

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

O projeto segue arquitetura **feature-first** dentro de `src/`:

```
openmonetis/
├── src/
│   ├── app/                       # Next.js App Router (rotas finas)
│   │   ├── api/                   # API Routes (auth, health, inbox)
│   │   ├── (auth)/                # Login e cadastro
│   │   ├── (dashboard)/           # Rotas protegidas (transactions, cards, accounts, etc.)
│   │   └── (landing-page)/        # Página inicial pública
│   │
│   ├── features/                  # Código de domínio por feature
│   │   ├── dashboard/             # Widgets, queries e métricas
│   │   ├── transactions/          # Lançamentos, ações em lote, exportação
│   │   ├── cards/                 # Cartões de crédito
│   │   ├── invoices/              # Faturas
│   │   ├── accounts/              # Contas bancárias
│   │   ├── categories/            # Categorias e histórico
│   │   ├── budgets/               # Orçamentos
│   │   ├── payers/                # Pagadores e compartilhamento
│   │   ├── inbox/                 # Pré-lançamentos do Companion
│   │   ├── insights/              # Análises com IA
│   │   ├── reports/               # Relatórios e exportações
│   │   ├── notes/                 # Anotações
│   │   ├── calendar/              # Calendário financeiro
│   │   ├── settings/              # Ajustes do usuário
│   │   ├── landing/               # Landing page
│   │   └── auth/                  # Formulários de autenticação
│   │
│   ├── shared/                    # Código reutilizado entre features
│   │   ├── components/            # UI compartilhada (shadcn/ui, navigation, skeletons...)
│   │   ├── hooks/                 # React hooks globais
│   │   ├── lib/                   # Helpers de domínio (auth, db, payers, schemas, email...)
│   │   └── utils/                 # Utilitários (currency, date, period, math, string...)
│   │
│   └── db/
│       └── schema.ts              # Drizzle schema (fonte única de verdade)
│
├── public/                        # Assets estáticos (imagens, logos, fontes)
├── drizzle/                       # Migrations geradas
├── scripts/                       # Scripts utilitários (migrations, dev)
├── Dockerfile                     # Multi-stage build (~200MB, non-root)
├── docker-compose.yml             # Orquestração app + PostgreSQL
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

Antes de começar, leia o [`CLAUDE.md`](CLAUDE.md) — ele documenta a arquitetura, convenções de nomenclatura, regras de queries e o checklist para novas features. Use TypeScript, commits semânticos e mantenha o `CHANGELOG.md` atualizado.

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
