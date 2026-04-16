# Dockerfile para Next.js 16 com multi-stage build otimizado

# ============================================
# Stage 1: Instalação de dependências
# ============================================
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copiar apenas arquivos de dependências para aproveitar cache
COPY package.json pnpm-lock.yaml* ./

# Criar pasta public para o postinstall do pdfjs-dist
RUN mkdir -p public

# Instalar dependências (production + dev para o build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build da aplicação
# ============================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copiar dependências instaladas do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código fonte
COPY . .

# Garantir que o pdf.worker vem da versão instalada no stage 1, não do host
COPY --from=deps /app/public/pdf.worker.min.mjs ./public/pdf.worker.min.mjs

# Variáveis de ambiente necessárias para o build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Token público do Logo.dev — injetado em build time (NEXT_PUBLIC_* é inlined pelo Next.js)
ARG NEXT_PUBLIC_LOGO_DEV_TOKEN
ENV NEXT_PUBLIC_LOGO_DEV_TOKEN=$NEXT_PUBLIC_LOGO_DEV_TOKEN

# Build da aplicação Next.js
RUN pnpm build

# ============================================
# Stage 3: Runtime (produção)
# ============================================
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Instalar deps do drizzle-kit em diretório separado ANTES de copiar o standalone
# Isso evita que o pnpm install sobrescreva o node_modules do Next.js standalone
COPY --from=builder /app/package.json /tmp/pkg.json
RUN mkdir -p /app/migrate && \
  node -e "\
  const p=JSON.parse(require('fs').readFileSync('/tmp/pkg.json','utf8'));\
  require('fs').writeFileSync('/app/migrate/package.json',JSON.stringify({\
    name:'openmonetis-migrate',version:p.version,\
    dependencies:{\
      'drizzle-orm':p.dependencies['drizzle-orm'],\
      'pg':p.dependencies['pg']\
    },\
    devDependencies:{'drizzle-kit':p.devDependencies['drizzle-kit']}\
  }));" && \
  cd /app/migrate && pnpm install --no-frozen-lockfile --ignore-scripts && \
  chown -R nextjs:nodejs /app/migrate

# Copiar apenas arquivos necessários para produção
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar arquivos de build do Next.js (inclui node_modules standalone com next)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar arquivos do Drizzle (migrations e schema)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/db ./src/db

# Copiar entrypoint de migrations
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh && \
    chown nextjs:nodejs /app/docker-entrypoint.sh

# Definir variáveis de ambiente de produção
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Expor porta
EXPOSE 3000

# Mudar para usuário não-root
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Entrypoint: roda migrations e depois executa o CMD
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
