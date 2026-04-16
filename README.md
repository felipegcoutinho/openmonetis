<p align="center">
  <img src="./public/images/logo_small.png" alt="OpenMonetis Logo" height="80" />
</p>

<p align="center">
  Projeto pessoal de gestão financeira. Self-hosted, manual e open source.
</p>

> **⚠️ Não há versão online hospedada.** Você precisa clonar o repositório e rodar localmente ou no seu próprio servidor.

[![Version](https://img.shields.io/badge/version-2.4.0-blue?style=flat-square)](CHANGELOG.md)
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

<p align="center">
  <img src="./public/images/preview-lancamentos-light.webp" alt="Lançamentos" width="800" />
</p>

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Como rodar o OpenMonetis](#-como-rodar-o-openmonetis)
  - [Perfil 1 — Usar](#perfil-1--usar-self-hosting)
  - [Perfil 2 — Desenvolver](#perfil-2--desenvolver)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Docker](#-docker)
- [Backup](#-backup)
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

**2. Não há Open Finance** — Não há conexão automática com bancos. Você pode registrar transações manualmente, usar o app companion para capturar notificações bancárias ou importar extratos nos formatos OFX e XLS/XLSX.

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

📲 **OpenMonetis Companion** — App Android que captura notificações bancárias (Nubank, Itaú, Bradesco, Inter, C6 e outros) e envia automaticamente como pré-lançamentos para revisão — sem digitar nada. [Repositório](https://github.com/felipegcoutinho/openmonetis-companion).

<p align="center">
  <img src="./public/images/companion-preview-light.webp" alt="OpenMonetis Companion" width="300" height="600" />
</p>

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

## 🚀 Como rodar o OpenMonetis

Escolha o perfil que corresponde ao seu objetivo:

| | Perfil 1 — Usar | Perfil 2 — Desenvolver |
|---|---|---|
| **Objetivo** | Rodar o app pronto | Modificar o código |
| **Clonar repositório** | Não | Sim |
| **Node.js / pnpm** | Não | Sim (Node 22+) |
| **Docker** | Sim | Sim |
| **Como iniciar** | `docker compose up -d` | `pnpm docker:db` + `pnpm dev` |
| **App roda em** | Container Docker | Host local (hot-reload) |
| **Banco roda em** | Container Docker | Container Docker |
| **`DATABASE_URL` (host)** | `db` (automático pelo compose) | `localhost` |
| **Banco remoto (Supabase, Neon...)** | Sim (`docker compose up -d app`) | Sim (ajustar `DATABASE_URL`) |
| **Como atualizar** | `pnpm docker:update` | `git pull` + `pnpm install` + `pnpm db:push` |
| **Indicado para** | Self-hosting, VPS, servidor | Contribuidores, customizações |

---

### Perfil 1 — Usar (self-hosting)

Só quer rodar o OpenMonetis. **Não precisa clonar o repositório nem instalar Node.js** — apenas Docker.

```bash
# 1. Baixe o compose
curl -fsSL https://raw.githubusercontent.com/felipegcoutinho/openmonetis/main/docker-compose.yml -o docker-compose.yml

# 2. Suba tudo
docker compose up -d
```

Acesse em: `http://localhost:3000`

O banco sobe com credenciais padrão. Para personalizar (senha, Google OAuth, e-mail, IA...), crie um `.env` na mesma pasta **antes** de subir:

```bash
# .env mínimo recomendado para produção
BETTER_AUTH_SECRET=gere-um-valor-com-openssl-rand-base64-32
BETTER_AUTH_URL=https://seu-dominio.com
```

Veja todas as variáveis disponíveis em [Variáveis de Ambiente](#-variáveis-de-ambiente).

**Banco remoto (Supabase, Neon, Railway...):** defina `DATABASE_URL` no `.env` e suba só o app:

```bash
docker compose up -d app
```

**Não tem Docker instalado?** Em servidores Ubuntu 24.04 limpos, use o script de instalação:

```bash
curl -fsSL https://raw.githubusercontent.com/felipegcoutinho/openmonetis/main/scripts/install-deps.sh -o install-deps.sh
sudo sh install-deps.sh
```

> Ao final, faça **logout e login** para as permissões do grupo `docker` terem efeito.

#### Atualizando (Perfil 1)

```bash
pnpm docker:update
# ou equivalente:
docker compose pull && docker compose up -d
```

O schema do banco é aplicado automaticamente no startup — nenhum passo extra necessário.

---

### Perfil 2 — Desenvolver

Quer modificar o código com hot-reload. O banco roda no Docker, o app roda direto no seu servidor.

**Requisitos:** Docker + Node.js 22+ + pnpm

```bash
# 1. Clone o repositório
git clone https://github.com/felipegcoutinho/openmonetis.git
cd openmonetis

# 2. Instale as dependências
pnpm install

# 3. Configure o ambiente
cp .env.example .env
# O DATABASE_URL já vem com host "localhost" (correto para dev local).
# Edite o .env com suas configurações (BETTER_AUTH_SECRET, etc.)

# 4. Suba o banco
pnpm docker:db

# 5. Habilite extensões do PostgreSQL (apenas no primeiro setup)
pnpm db:extensions

# 6. Aplique o schema no banco (apenas no primeiro setup)
pnpm db:push

# 7. Inicie o app com hot-reload
pnpm dev
```

Acesse em: `http://localhost:3000`

Toda vez que salvar um arquivo, o app atualiza automaticamente sem precisar reiniciar.

#### Atualizando (Perfil 2)

```bash
git pull
pnpm install        # instala dependências novas, se houver
pnpm db:push        # aplica mudanças de schema, se houver
```

O `pnpm dev` já em execução detecta as mudanças de código automaticamente — não precisa reiniciar.

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
pnpm db:extensions    # Habilitar extensões PostgreSQL (rodar uma vez)
pnpm db:studio        # Drizzle Studio (UI visual)
```

### Utilitários

```bash
pnpm backup           # Backup completo do banco (ver seção Backup)
```

### Docker

```bash
pnpm docker:up      # Sobe app (Docker Hub) + banco em background
pnpm docker:db      # Sobe apenas o banco em background (usar com pnpm dev)
pnpm docker:down    # Para e remove os containers
pnpm docker:logs    # Logs em tempo real (todos os containers)
pnpm docker:update  # Atualiza para a imagem mais recente do Hub e reinicia
```

---

## 🐳 Docker

O `Dockerfile` usa multi-stage build (deps → builder → runner) com imagem final ~200MB rodando como usuário não-root. Health checks configurados para ambos os serviços (PostgreSQL via `pg_isready`, app via `GET /api/health`).

### Self-hosting (recomendado)

Baixe apenas o `docker-compose.yml` e suba tudo — sem clonar o repositório, sem instalar dependências:

```bash
curl -fsSL https://raw.githubusercontent.com/felipegcoutinho/openmonetis/main/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

As credenciais padrão do banco já estão configuradas. Para personalizar (senhas, opcionais), crie um `.env` na mesma pasta antes de subir — veja [Variáveis de Ambiente](#-variáveis-de-ambiente).

### Banco remoto (Supabase, Neon, Railway...)

Suba apenas o app e aponte para o banco externo via `DATABASE_URL` no `.env`:

```bash
docker compose up -d app
```

### Comandos úteis

```bash
docker compose exec app sh                                       # Shell da aplicação
docker compose exec db psql -U openmonetis -d openmonetis_db    # Shell do banco
docker compose ps                                                # Status
docker compose exec db pg_dump -U openmonetis openmonetis_db > backup.sql   # Backup
docker compose exec -T db psql -U openmonetis -d openmonetis_db < backup.sql  # Restore
```

### Customizando portas

```env
APP_PORT=3001   # Padrão: 3000
DB_PORT=5433    # Padrão: 5432
```

---

## 💾 Backup

O backup é uma rotina de infraestrutura — não é uma tela no app. Ele opera diretamente sobre o banco PostgreSQL e é executado via linha de comando.

```bash
pnpm backup
```

### O que é salvo

Cada execução gera **3 arquivos** em `backup/`:

| Arquivo | Conteúdo | Uso |
|---|---|---|
| `openmonetis_YYYY-MM-DD_HH-MM.dump` | Dump custom do PostgreSQL (binário) | Restore completo via `pg_restore` |
| `openmonetis_YYYY-MM-DD_HH-MM.sql.gz` | Dump SQL completo compactado | Inspeção manual, portabilidade |
| `openmonetis_YYYY-MM-DD_HH-MM.data.sql.gz` | Apenas os dados da schema `public` | Migração parcial, seed de outro ambiente |

### Modos de conexão

Configure `DB_MODE` no topo de `scripts/backup.sh`:

| Modo | Quando usar | Fonte de dados |
|---|---|---|
| `remote` (padrão) | Banco em Supabase, Neon, Railway, etc. | `DATABASE_URL` do `.env` |
| `docker` | Banco no container local | Container `openmonetis_postgres` |

### Upload para Google Drive (opcional)

Se o [rclone](https://rclone.org/) estiver instalado e configurado com um remote chamado `gdrive`, os arquivos são enviados automaticamente para `gdrive:BACKUP OPENMONETIS`. Sem o rclone, o backup funciona normalmente e fica apenas local.

**Retenção:**
- Local: 7 dias
- Google Drive: 30 dias

### Automatizar com cron

Para rodar o backup automaticamente todo dia às 3h:

```bash
crontab -e
```

```cron
0 3 * * * cd /caminho/para/openmonetis && pnpm backup >> /var/log/openmonetis-backup.log 2>&1
```

### Restore

```bash
# A partir do .dump (recomendado — mais rápido)
pg_restore --clean --no-owner --no-privileges \
  -d "postgresql://user:senha@host:5432/openmonetis_db" \
  backup/openmonetis_YYYY-MM-DD_HH-MM.dump

# A partir do .sql.gz (banco local via Docker)
gunzip -c backup/openmonetis_YYYY-MM-DD_HH-MM.sql.gz | \
  docker compose exec -T db psql -U openmonetis -d openmonetis_db
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
- A implementação usa `endpoint` customizado e `forcePathStyle: true` em [`src/shared/lib/storage/s3-client.ts`](./src/shared/lib/storage/s3-client.ts).
- Em geral isso cobre MinIO, Cloudflare R2, Backblaze B2 S3-Compatible, DigitalOcean Spaces e AWS S3. Mas foi testado apenas no Supabase Storage.
- Se o seu provider exigir `virtual-hosted-style` em vez de `path-style`, você vai precisar ajustar essa configuração antes de usar anexos.
- Se as variáveis de S3 não forem configuradas, mantenha os anexos desabilitados no seu fluxo de uso.

---

## 🔐 Variáveis de Ambiente

**Perfil 2 (dev):** copie `.env.example` para `.env` — o `DATABASE_URL` já vem com `localhost`, pronto para uso com `pnpm dev`.

**Perfil 1 (Docker):** não precisa definir `DATABASE_URL` — o compose já configura automaticamente com host `db`. Só defina se usar banco remoto (Supabase, Neon, etc.).

### Obrigatórias

```env
# Perfil 2 (dev): host "localhost" — o banco roda em container, o app no host
# Perfil 1 (Docker): não precisa definir — o compose usa "db" automaticamente
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
