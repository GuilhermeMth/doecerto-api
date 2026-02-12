#!/bin/sh

# O script para se houver erro
set -e

echo "⏳ Verificando disponibilidade do banco de dados..."

# Aguarda a porta 3306 do serviço 'db' responder
# Se o host for diferente de 'db', a variável $DB_HOST deve ser passada pela infra
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}

while ! nc -z $DB_HOST $DB_PORT; do
  echo "... aguardando o MySQL em $DB_HOST:$DB_PORT"
  sleep 2
done

echo "✅ Banco de dados detectado!"

# 1. Aplica as migrations que ainda não foram aplicadas
echo "🚀 Sincronizando schema do banco (Prisma Migrate)..."
npx prisma migrate deploy

# 2. Continua para o comando principal (node dist/main)
echo "🏁 Iniciando o servidor NestJS..."
exec "$@"