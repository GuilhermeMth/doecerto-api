# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
# Geramos o cliente aqui para garantir que o build do NestJS (TS -> JS) funcione
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# --- STAGE 2: RUNNER ---
FROM node:20-alpine AS runner
# Adicionado libc6-compat aqui também, pois o engine do Prisma precisa dele no Alpine
RUN apk add --no-cache openssl netcat-openbsd libc6-compat

ENV NODE_ENV=production
WORKDIR /app

# 1. Copia dependências e código
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# 2. O PONTO CHAVE: Você PRECISA copiar a pasta gerada se o output não for o padrão
# Como seu erro indicou '../../generated', essa pasta TEM que vir do builder
COPY --from=builder /app/generated ./generated 

# 3. Configura o entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 4. Permissões de pastas
USER root
# Adicionamos /app/generated na lista de permissões
RUN mkdir -p /app/uploads/profiles /app/uploads/payment-proofs /app/logs && \
    chown -R node:node /app/uploads /app/logs /app/prisma /app/generated
USER node

EXPOSE 3501

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]