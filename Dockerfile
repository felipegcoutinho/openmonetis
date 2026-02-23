# Dockerfile para Next.js 16 com multi-stage build otimizado

# ============================================
# Stage 1: Instalação de dependências
# ============================================
FROM node:22-alpine AS deps

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar apenas arquivos de dependências para aproveitar cache
COPY package.json pnpm-lock.yaml* ./

# Instalar dependências (production + dev para o build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build da aplicação
# ============================================
FROM node:22-alpine AS builder

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar dependências instaladas do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código fonte
COPY . .

# Variáveis de ambiente necessárias para o build
# DATABASE_URL será fornecida em runtime, mas precisa estar definida para validação
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build da aplicação Next.js
# Nota: Se houver erros de tipo, ajuste typescript.ignoreBuildErrors no next.config.ts
RUN pnpm build

# ============================================
# Stage 3: Runtime (produção)
# ============================================
FROM node:22-alpine AS runner

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar apenas arquivos necessários para produção
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copiar arquivos de build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar arquivos do Drizzle (migrations e schema)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/db ./db

# Copiar scripts e lib para rodar patch de migração (ex.: db:migrate-parcelado-164) no container
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Copiar node_modules para ter drizzle-kit disponível para migrations
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Definir variáveis de ambiente de produção
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Expor porta
EXPOSE 3000

# Ajustar permissões para o usuário nextjs
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Comando de inicialização
# Nota: Em produção com standalone build, o servidor é iniciado pelo arquivo server.js
CMD ["node", "server.js"]
