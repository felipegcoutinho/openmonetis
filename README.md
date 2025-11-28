<p align="center">
  <img src="./public/logo_small.png" alt="Opensheets Logo" height="80" />
</p>

<p align="center">
  Projeto pessoal de gestão financeira. Self-hosted, manual e open source.
</p>

> **⚠️ Não há versão online hospedada.** Você precisa clonar o repositório e rodar localmente ou no seu próprio servidor ou computador.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)

---

<p align="center">
  <img src="./public/dashboard-preview.png" alt="Dashboard Preview" width="800" />
</p>

---

## 📖 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Início Rápido](#-início-rápido)
  - [Opção 1: Desenvolvimento Local (Recomendado para Devs)](#opção-1-desenvolvimento-local-recomendado-para-devs)
  - [Opção 2: Docker Completo (Usuários Finais)](#opção-2-docker-completo-usuários-finais)
  - [Opção 3: Docker + Banco Remoto](#opção-3-docker--banco-remoto)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Docker - Guia Detalhado](#-docker---guia-detalhado)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Banco de Dados](#-banco-de-dados)
- [Arquitetura](#-arquitetura)
- [Contribuindo](#-contribuindo)

---

## 🎯 Sobre o Projeto

**Opensheets** é um projeto pessoal de gestão financeira que criei para organizar minhas próprias finanças. Cansei de usar planilhas desorganizadas e aplicativos que não fazem exatamente o que preciso, então decidi construir algo do jeito que funciona pra mim.

A ideia é simples: ter um lugar onde consigo ver todas as minhas contas, cartões, gastos e receitas de forma clara. Se isso for útil pra você também, fique à vontade para usar e contribuir.

### ⚠️ Avisos importantes

**1. Não há versão hospedada online**

Este projeto é self-hosted. Você precisa rodar no seu próprio computador ou servidor. Não existe uma versão pública online onde você pode simplesmente criar uma conta.

**2. Não há Open Finance**

Você precisa registrar manualmente suas transações. Se você procura algo que sincroniza automaticamente com seu banco, este projeto não é pra você.

**3. Requer disciplina**

O Opensheets funciona melhor para quem:

- Tem disciplina de registrar os gastos regularmente
- Quer controle total sobre seus dados
- Gosta de entender exatamente onde o dinheiro está indo
- Sabe rodar projetos localmente ou tem vontade de aprender

Se você não se importa em dedicar alguns minutos por dia (ou semana) para manter tudo atualizado, vai funcionar bem. Caso contrário, provavelmente vai abandonar depois de uma semana.

### O que tem aqui

💰 **Controle de contas e transações**

- Registre suas contas bancárias, cartões e dinheiro em espécie
- Adicione receitas, despesas e transferências entre contas
- Organize tudo por categorias (moradia, alimentação, transporte, etc.)
- Veja o saldo atual de cada conta

📊 **Relatórios e gráficos**

- Dashboard com resumo mensal das suas finanças
- Gráficos de evolução do patrimônio
- Comparação de gastos por categoria
- Entenda pra onde seu dinheiro está indo

💳 **Faturas de cartão de crédito**

- Cadastre seus cartões e acompanhe as faturas
- Veja o que ainda não foi fechado na fatura atual
- Controle de limites e vencimentos

🎯 **Orçamentos**

- Defina quanto quer gastar por categoria no mês
- Acompanhe se está dentro do planejado

### Stack técnica

Construído com tecnologias modernas que facilitam o desenvolvimento:

- **Next.js 16** com App Router e Turbopack
- **TypeScript** em tudo
- **PostgreSQL 18** como banco de dados
- **Drizzle ORM** para trabalhar com o banco
- **Better Auth** para login (email + OAuth)
- **shadcn/ui** para os componentes da interface
- **Docker** para facilitar deploy e desenvolvimento
- **Tailwind CSS** para estilização

O projeto é open source, seus dados ficam no seu controle (pode rodar localmente ou no seu próprio servidor), e você pode customizar o que quiser.

---

## ✨ Features

### 🔐 Autenticação

- Better Auth integrado
- OAuth (Google, GitHub)
- Email magic links
- Session management
- Protected routes via middleware

### 🗄️ Banco de Dados

- PostgreSQL 18 (última versão estável)
- Drizzle ORM com TypeScript
- Migrations automáticas
- Drizzle Studio (UI visual para DB)
- Suporte para banco local (Docker) ou remoto (Supabase, Neon, etc)

### 🎨 Interface

- shadcn/ui components
- Tailwind CSS v4
- Dark mode suportado
- Animações com Framer Motion

### 🐳 Docker

- Multi-stage build otimizado
- Health checks para app e banco
- Volumes persistentes
- Network isolada
- Scripts npm facilitados

### 🧪 Desenvolvimento

- Next.js 16 com App Router
- Turbopack (fast refresh)
- TypeScript 5.9
- ESLint + Prettier
- React 19

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript 5.9
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix UI)
- **Icons:** Lucide React, Remixicon
- **Animations:** Framer Motion

### Backend

- **Runtime:** Node.js 22
- **Database:** PostgreSQL 18
- **ORM:** Drizzle ORM
- **Auth:** Better Auth
- **Email:** Resend

### DevOps

- **Containerization:** Docker + Docker Compose
- **Package Manager:** pnpm
- **Build Tool:** Turbopack

### AI Integration (Opcional)

- Anthropic (Claude)
- OpenAI (GPT)
- Google Gemini
- OpenRouter

---

## 🚀 Início Rápido

Escolha a opção que melhor se adequa ao seu caso:

| Cenário     | Quando usar                               | Comando principal                      |
| ----------- | ----------------------------------------- | -------------------------------------- |
| **Opção 1** | Você vai **desenvolver** e alterar código | `docker compose up db -d` + `pnpm dev` |
| **Opção 2** | Você só quer **usar** a aplicação         | `pnpm docker:up`                       |
| **Opção 3** | Você já tem um **banco remoto**           | `docker compose up app --build`        |

---

### Opção 1: Desenvolvimento Local (Recomendado para Devs)

Esta é a **melhor opção para desenvolvedores** que vão modificar o código.

#### Pré-requisitos

- Node.js 22+ instalado (se usar nvm, execute `nvm install` ou `nvm use`)
- pnpm instalado (ou npm/yarn)
- Docker e Docker Compose instalados

#### Passo a Passo

1. **Clone o repositório**

   ```bash
   git clone https://github.com/felipegcoutinho/opensheets.git
   cd opensheets
   ```

2. **Instale as dependências**

   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente**

   ```bash
   cp .env.example .env
   ```

   Edite o `.env` e configure:

   ```env
   # Banco de dados (usando Docker)
   DATABASE_URL=postgresql://opensheets:opensheets_dev_password@localhost:5432/opensheets_db
   DB_PROVIDER=local

   # Better Auth (gere com: openssl rand -base64 32)
   BETTER_AUTH_SECRET=seu-secret-aqui
   BETTER_AUTH_URL=http://localhost:3000
   ```

4. **Suba apenas o PostgreSQL em Docker**

   ```bash
   docker compose up db -d
   ```

   Isso sobe **apenas o banco de dados** em container. A aplicação roda localmente.

5. **Ative as extensões necessárias no PostgreSQL**

   ```bash
   pnpm db:enableExtensions
   ```

   Ou você pode importar o script diretamente no banco de dados: `scripts/postgres/init.sql`

6. **Execute as migrations**

   ```bash
   pnpm db:push
   ```

7. **Inicie o servidor de desenvolvimento**

   ```bash
   pnpm dev
   ```

8. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

#### Por que esta opção?

- ✅ **Hot reload perfeito** - Mudanças no código refletem instantaneamente
- ✅ **Debugger funciona** - Use breakpoints normalmente
- ✅ **Menos recursos** - Só o banco roda em Docker
- ✅ **Drizzle Studio** - Acesse com `pnpm db:studio`
- ✅ **Melhor DX** - Developer Experience otimizada

---

### Opção 2: Docker Completo (Usuários Finais)

Ideal para quem quer apenas **usar a aplicação** sem mexer no código.

#### Pré-requisitos

- Docker e Docker Compose instalados

#### Passo a Passo

1. **Clone o repositório**

   ```bash
   git clone https://github.com/felipegcoutinho/opensheets.git
   cd opensheets
   ```

2. **Configure as variáveis de ambiente**

   ```bash
   cp .env.example .env
   ```

   Edite o `.env`:

   ```env
   # Use o host "db" (nome do serviço Docker)
   DATABASE_URL=postgresql://opensheets:opensheets_dev_password@db:5432/opensheets_db
   DB_PROVIDER=local

   # Better Auth
   BETTER_AUTH_SECRET=seu-secret-aqui
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Suba tudo em Docker**

   ```bash
   pnpm docker:up
   # ou: docker compose up --build
   ```

   Isso sobe **aplicação + banco de dados** em containers.

4. **Acesse a aplicação**

   ```
   http://localhost:3000
   ```

5. **Para parar**
   ```bash
   pnpm docker:down
   # ou: docker compose down
   ```

#### Dicas

- Use `pnpm docker:up:detached` para rodar em background
- Veja logs com `pnpm docker:logs`
- Reinicie com `pnpm docker:restart`

---

### Opção 3: Docker + Banco Remoto

Se você já tem PostgreSQL no **Supabase**, **Neon**, **Railway**, etc.

#### Passo a Passo

1. **Configure o `.env` com banco remoto**

   ```env
   DATABASE_URL=postgresql://user:password@host.region.provider.com:5432/database?sslmode=require
   DB_PROVIDER=remote

   BETTER_AUTH_SECRET=seu-secret-aqui
   BETTER_AUTH_URL=http://localhost:3000
   ```

2. **Suba apenas a aplicação**

   ```bash
   docker compose up app --build
   ```

3. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

---

## 📜 Scripts Disponíveis

### Desenvolvimento

```bash
# Servidor de desenvolvimento (com Turbopack)
pnpm dev

# Build de produção
pnpm build

# Servidor de produção
pnpm start

# Linter
pnpm lint
```

### Banco de Dados (Drizzle)

```bash
# Gerar migrations a partir do schema
pnpm db:generate

# Executar migrations
pnpm db:migrate

# Push schema direto para o banco (dev only)
pnpm db:push

# Abrir Drizzle Studio (UI visual do banco)
pnpm db:studio
```

### Docker

```bash
# Subir todos os containers (app + banco)
pnpm docker:up

# Subir em background (detached mode)
pnpm docker:up:detached

# Parar todos os containers
pnpm docker:down

# Parar e REMOVER volumes (⚠️ apaga dados do banco!)
pnpm docker:down:volumes

# Ver logs em tempo real
pnpm docker:logs

# Logs apenas da aplicação
pnpm docker:logs:app

# Logs apenas do banco de dados
pnpm docker:logs:db

# Reiniciar containers
pnpm docker:restart

# Rebuild completo (força reconstrução)
pnpm docker:rebuild
```

### Utilitários

```bash
# Setup automático de variáveis de ambiente
pnpm env:setup
```

---

## 🐳 Docker - Guia Detalhado

### Arquitetura Docker

```
┌─────────────────────────────────────────────────┐
│              docker-compose.yml                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐      ┌─────────────────┐ │
│  │   app            │      │      db         │ │
│  │   (Next.js 16)   │◄─────┤  (PostgreSQL 18)│ │
│  │   Port: 3000     │      │  Port: 5432     │ │
│  │   Node.js 22     │      │  Alpine Linux   │ │
│  └──────────────────┘      └─────────────────┘ │
│                                                 │
│  Network: opensheets_network (bridge)                │
│  Volume: opensheets_postgres_data (persistent)       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Multi-Stage Build

O `Dockerfile` usa **3 stages** para otimização:

1. **deps** - Instala dependências
2. **builder** - Builda a aplicação (Next.js standalone)
3. **runner** - Imagem final mínima (apenas produção)

**Benefícios:**

- Imagem final **muito menor** (~200MB vs ~1GB)
- Build cache eficiente
- Apenas dependências de produção no final
- Security: roda como usuário não-root

### Health Checks

Ambos os serviços têm health checks:

**PostgreSQL:**

- Comando: `pg_isready`
- Intervalo: 10s
- Timeout: 5s

**Next.js App:**

- Endpoint: `http://localhost:3000/api/health`
- Intervalo: 30s
- Start period: 40s (aguarda build)

### Volumes e Persistência

```yaml
volumes:
  postgres_data:
    name: opensheets_postgres_data
    driver: local
```

- Os dados do PostgreSQL **persistem** entre restarts
- Para **apagar dados**: `pnpm docker:down:volumes`
- Para **backup**: `docker compose exec db pg_dump...`

### Network Isolada

```yaml
networks:
  opensheets_network:
    name: opensheets_network
    driver: bridge
```

- App e banco se comunicam via network interna
- Isolamento de segurança
- DNS automático (app acessa `db:5432`)

### Comandos Docker Avançados

```bash
# Entrar no container da aplicação
docker compose exec app sh

# Entrar no container do banco
docker compose exec db psql -U opensheets -d opensheets_db

# Ver status dos containers
docker compose ps

# Ver uso de recursos
docker stats opensheets_app opensheets_postgres

# Backup do banco
docker compose exec db pg_dump -U opensheets opensheets_db > backup.sql

# Restaurar backup
docker compose exec -T db psql -U opensheets -d opensheets_db < backup.sql

# Limpar tudo (containers, volumes, images)
docker compose down -v
docker system prune -a
```

### Customizando Portas

No arquivo `.env`:

```env
# Porta da aplicação (padrão: 3000)
APP_PORT=3001

# Porta do banco de dados (padrão: 5432)
DB_PORT=5433
```

---

## 🔐 Configuração de Variáveis de Ambiente

Copie o `.env.example` para `.env` e configure:

### Variáveis Obrigatórias

```env
# === Database ===
DATABASE_URL=postgresql://opensheets:opensheets_dev_password@localhost:5432/opensheets_db
DB_PROVIDER=local  # ou "remote"

# === Better Auth ===
# Gere com: openssl rand -base64 32
BETTER_AUTH_SECRET=seu-secret-super-secreto-aqui
BETTER_AUTH_URL=http://localhost:3000
```

### Variáveis Opcionais

#### PostgreSQL (customização)

```env
POSTGRES_USER=opensheets
POSTGRES_PASSWORD=opensheets_dev_password
POSTGRES_DB=opensheets_db
```

#### Portas (customização)

```env
APP_PORT=3000
DB_PORT=5432
```

#### OAuth Providers

```env
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

GITHUB_CLIENT_ID=seu-github-client-id
GITHUB_CLIENT_SECRET=seu-github-client-secret
```

#### Email (Resend)

```env
RESEND_API_KEY=re_seu_api_key
EMAIL_FROM=noreply@seudominio.com
```

#### AI Providers

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENROUTER_API_KEY=sk-or-...
```

### Gerando Secrets

```bash
# BETTER_AUTH_SECRET
openssl rand -base64 32

# Ou use o script automático
pnpm env:setup
```

---

## 🗄️ Banco de Dados

### Escolhendo entre Local e Remoto

| Modo       | Quando usar                           | Como configurar                        |
| ---------- | ------------------------------------- | -------------------------------------- |
| **Local**  | Desenvolvimento, testes, prototipagem | `DB_PROVIDER=local` + Docker           |
| **Remoto** | Produção, deploy, banco gerenciado    | `DB_PROVIDER=remote` + URL do provider |

### Drizzle ORM

#### Schema Definition

Os schemas ficam em `/db/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### Gerando Migrations

```bash
# Após alterar /db/schema.ts
pnpm db:generate

# Aplica migrations
pnpm db:migrate

# Ou push direto (dev only)
pnpm db:push
```

#### Drizzle Studio

Interface visual para explorar e editar dados:

```bash
pnpm db:studio
```

Abre em: `https://local.drizzle.studio`

### Migrations Automáticas (Docker)

No `docker-compose.yml`, migrations rodam automaticamente:

```yaml
command:
  - |
    echo "📦 Rodando migrations..."
    pnpm db:push

    echo "✅ Iniciando aplicação..."
    node server.js
```

### Backup e Restore

```bash
# Backup (banco local Docker)
docker compose exec db pg_dump -U opensheets opensheets_db > backup_$(date +%Y%m%d).sql

# Backup (banco remoto)
pg_dump $DATABASE_URL > backup.sql

# Restore (Docker)
docker compose exec -T db psql -U opensheets -d opensheets_db < backup.sql

# Restore (remoto)
psql $DATABASE_URL < backup.sql
```

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
opensheets/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Better Auth endpoints
│   │   └── health/          # Health check
│   ├── (dashboard)/         # Protected routes (com auth)
│   └── layout.tsx           # Root layout
│
├── components/              # React Components
│   ├── ui/                  # shadcn/ui components
│   └── ...                  # Feature components
│
├── lib/                     # Shared utilities
│   ├── db.ts               # Drizzle client
│   ├── auth.ts             # Better Auth server
│   └── auth-client.ts      # Better Auth client
│
├── db/                      # Drizzle schema
│   └── schema.ts           # Database schema
│
├── drizzle/                 # Generated migrations
│   └── migrations/
│
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
├── scripts/                 # Utility scripts
│   ├── setup-env.sh        # Env setup automation
│   └── postgres/init.sql   # PostgreSQL init script
│
├── docker/                  # Docker configs
│   └── postgres/init.sql
│
├── Dockerfile              # Production build
├── docker-compose.yml      # Docker orchestration
├── next.config.ts          # Next.js config
├── drizzle.config.ts       # Drizzle ORM config
├── tailwind.config.ts      # Tailwind config
└── tsconfig.json           # TypeScript config
```

### Fluxo de Autenticação

```
1. Usuário acessa rota protegida
   ↓
2. middleware.ts verifica sessão (Better Auth)
   ↓
3. Se não autenticado → redirect /auth
   ↓
4. Usuário faz login (OAuth ou email)
   ↓
5. Better Auth valida e cria sessão
   ↓
6. Cookie de sessão é salvo
   ↓
7. Usuário acessa rota protegida ✅
```

### Fluxo de Build (Docker)

```
1. Stage deps: Instala dependências
   ↓
2. Stage builder: Builda Next.js (standalone)
   ↓
3. Stage runner: Copia apenas build + deps prod
   ↓
4. Container final: ~200MB (otimizado)
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas!

### Como contribuir

1. **Fork** o projeto
2. **Clone** seu fork
   ```bash
   git clone https://github.com/seu-usuario/opensheets.git
   ```
3. **Crie uma branch** para sua feature
   ```bash
   git checkout -b feature/minha-feature
   ```
4. **Commit** suas mudanças
   ```bash
   git commit -m 'feat: adiciona minha feature'
   ```
5. **Push** para a branch
   ```bash
   git push origin feature/minha-feature
   ```
6. Abra um **Pull Request**

### Padrões

- Use **TypeScript**
- Documente **features novas**
- Use **commits semânticos** (feat, fix, docs, etc)

---

## 📄 Licença

Este projeto é open source e está disponível sob a [Licença MIT](LICENSE).

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/)
- [Better Auth](https://better-auth.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

## 📞 Contato

**Desenvolvido por:** Felipe Coutinho
**GitHub:** [@felipegcoutinho](https://github.com/felipegcoutinho)
**Repositório:** [opensheets](https://github.com/felipegcoutinho/opensheets)

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

Desenvolvido com ❤️ para a comunidade open source

</div>
