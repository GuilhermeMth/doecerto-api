# STAGE 1: BUILD
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instala e gera o client no seu path customizado ../generated/prisma
RUN npm ci

COPY . .
RUN npm run build

# ---

# STAGE 2: RUNNER (A imagem leve que vai para o Registry)
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
ENV NODE_ENV=production

WORKDIR /app

# Copia os arquivos de build e as dependências de prod
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copia a pasta generated (seu output customizado) e a pasta prisma (para migrations)
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

USER node
EXPOSE 3000

# O comando garante que o banco atualize antes do app subir
CMD npx prisma migrate deploy && node dist/main