# ============================================
# DoeCerto API - Dockerfile Otimizado
# Multi-stage build para máxima eficiência
# ============================================

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:22-alpine3.23 AS deps

# Instalar dependências do sistema necessárias para build
RUN apk add --no-cache \
    openssl \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copiar apenas package files para melhor cache
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (ci é mais rápido e determinístico)
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Gerar Prisma Client
RUN npx prisma generate

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:22-alpine3.23 AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar node_modules da stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated

# Copiar código fonte
COPY . .

# Instalar devDependencies para build
RUN npm install --only=development

# Build TypeScript
RUN npm run build

# Gerar SQL de seed
RUN node scripts/generate-seed-sql.js

# ============================================
# STAGE 3: Production
# ============================================
FROM node:22-alpine3.23 AS production

# Instalar apenas runtime essencial
RUN apk add --no-cache \
    openssl \
    netcat-openbsd \
    mysql-client \
    dumb-init \
    curl && \
    rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

ENV NODE_ENV=production \
    PORT=3501 \
    TZ=America/Sao_Paulo

WORKDIR /app

# Copiar apenas o necessário
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/generated ./generated
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/seed-data.sql ./seed-data.sql
COPY --chown=nodejs:nodejs entrypoint.sh ./entrypoint.sh

# Criar diretórios necessários
RUN mkdir -p /app/uploads/profiles /app/uploads/payment-proofs /app/logs && \
    chown -R nodejs:nodejs /app && \
    chmod +x /app/entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT}', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

USER nodejs

EXPOSE 3501

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/app/entrypoint.sh"]