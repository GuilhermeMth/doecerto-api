# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
# GERA O CLIENTE AQUI para o código compilar com os tipos corretos
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# --- STAGE 2: RUNNER ---
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl netcat-openbsd

ENV NODE_ENV=production
WORKDIR /app

# Copia dependências e código compilado
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Se o seu prisma output for customizado (../generated), descomente a linha abaixo:
# COPY --from=builder /app/generated ./generated 

# Configura o entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Permissões de pastas
USER root
RUN mkdir -p /app/uploads /app/logs && \
    chown -R node:node /app/uploads /app/logs /app/prisma
USER node

EXPOSE 3501

# ENTRYPOINT chama o script, CMD passa o comando final para o 'exec "$@"'
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]