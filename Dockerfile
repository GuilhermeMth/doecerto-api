# STAGE 1: BUILDER
FROM node:22-alpine3.23 AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# STAGE 2: RUNNER
FROM node:22-alpine3.23 AS runner
# Instalamos o netcat aqui para o entrypoint que virá de fora funcionar
RUN apk add --no-cache openssl netcat-openbsd
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Criamos as pastas de logs e uploads e copiamos entrypoint
USER root
RUN mkdir -p /app/uploads/profiles /app/uploads/payment-proofs /app/logs && \
    chown -R node:node /app/uploads /app/logs /app/node_modules /app/dist /app/prisma /app/package*.json
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown node:node /app/entrypoint.sh
USER node

EXPOSE 3501

# Usar entrypoint para rodar migrations e seed
ENTRYPOINT ["/app/entrypoint.sh"]