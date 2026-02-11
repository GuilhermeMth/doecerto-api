#!/bin/bash
set -e

echo "🚀 Iniciando aplicação..."

# Aguardar banco de dados estar pronto (se estiver configurado)
if [ ! -z "$DATABASE_URL" ]; then
  echo "⏳ Aguardando banco de dados estar pronto..."
  
  # Extrair host e porta da DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_PORT=${DATABASE_PORT:-3306}
  
  # Se não conseguir extrair, usa localhost
  if [ -z "$DB_HOST" ]; then
    DB_HOST=${DATABASE_HOST:-localhost}
  fi
  
  # Aguardar conexão
  count=0
  max_attempts=30
  while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null && [ $count -lt $max_attempts ]; do
    echo "⏳ Tentando conectar ao banco de dados em $DB_HOST:$DB_PORT (tentativa $((count+1))/$max_attempts)..."
    sleep 2
    count=$((count+1))
  done
  
  if [ $count -eq $max_attempts ]; then
    echo "❌ Timeout aguardando banco de dados"
    exit 1
  fi
  
  echo "✅ Banco de dados pronto!"

  # Rodar migrations
  echo "🔄 Executando migrations..."
  npx prisma migrate deploy || echo "⚠️  Migrations já aplicadas ou erro (continuando...)"

  # Rodar seed para criar dados mockados (admin, donors, etc)
  echo "🌱 Seeding dados mockados..."
  npx prisma db seed || echo "⚠️  Seed já executado ou erro (continuando...)"
  
  echo "✅ Banco de dados atualizado!"
fi

echo "✅ Tudo pronto! Iniciando servidor..."
exec node dist/main
