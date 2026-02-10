# STAGE 1: BUILDER
FROM node:20-alpine AS builder

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
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Correção de permissões para o usuário node
USER root
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 3501

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]