#!/bin/sh
set -e

# Aguarda o banco (usando as variáveis do seu docker-compose)
echo "⏳ Aguardando MySQL em mysql:3306..."
while ! nc -z mysql 3306; do
  sleep 1
done

echo "✅ Banco online!"

# Roda as migrations (Rápido, pois só aplica o que falta)
echo "🚀 Aplicando migrations..."
npx prisma migrate deploy

# Inicia a aplicação
exec "$@"