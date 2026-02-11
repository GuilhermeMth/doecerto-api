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

  # Importar dados mockados gerados durante o build
  if [ -f "/app/seed-data.sql" ]; then
    echo "🌱 Importando dados mockados..."
    # Extrair credenciais do DATABASE_URL
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /app/seed-data.sql || echo "⚠️  Erro ao importar seed (continuando...)"
    echo "✅ Dados mockados importados!"
  fi
fi

echo "✅ Tudo pronto! Iniciando servidor..."
exec node dist/main
