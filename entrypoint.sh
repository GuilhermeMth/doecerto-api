#!/bin/sh
set -e

echo "🚀 DoeCerto API Starting..."
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-3501}"

# ============================================
# Aguardar Database
# ============================================
wait_for_db() {
    local host=$1
    local port=$2
    local max_attempts=60
    local attempt=0

    echo "⏳ Aguardando database em $host:$port..."
    
    while ! nc -z "$host" "$port" 2>/dev/null; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo "❌ Timeout aguardando database"
            return 1
        fi
        sleep 1
    done
    
    echo "✅ Database conectado!"
    return 0
}

# Extrair informações do DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:\/]*\).*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    DB_HOST=${DB_HOST:-${DATABASE_HOST:-localhost}}
    DB_PORT=${DB_PORT:-3306}
    
    wait_for_db "$DB_HOST" "$DB_PORT" || echo "⚠️ Continuando sem DB..."
    
    # Executar migrations
    echo "🔄 Aplicando migrations..."
    npx prisma migrate deploy || echo "⚠️ Migrations já aplicadas"
    
    # Seed apenas se não existir admin
    if [ -f "/app/seed-data.sql" ]; then
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        ADMIN_EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
            -sN -e "SELECT COUNT(*) FROM users WHERE role='admin' LIMIT 1" 2>/dev/null || echo "0")
        
        if [ "$ADMIN_EXISTS" = "0" ]; then
            echo "🌱 Importando seed data..."
            mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /app/seed-data.sql || \
                echo "⚠️ Erro ao importar seed"
        fi
    fi
fi

# Aguardar Redis (opcional)
if [ -n "$REDIS_HOST" ]; then
    REDIS_PORT=${REDIS_PORT:-6379}
    echo "⏳ Aguardando Redis..."
    nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null && echo "✅ Redis conectado!" || \
        echo "⚠️ Redis indisponível"
fi

# Validar JWT_SECRET
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change-me" ]; then
    echo "⚠️ WARNING: JWT_SECRET não configurado corretamente!"
fi

echo "✅ Iniciando servidor..."
exec node dist/main.js