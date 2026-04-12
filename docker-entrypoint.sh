#!/bin/sh

# Dentro do container Docker, "localhost" não alcança o serviço de banco.
# Substitui automaticamente para o nome do serviço "db" da rede Docker.
# Não afeta URLs de bancos remotos (não contêm "@localhost:").
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|@localhost:|@db:|g')
  export DATABASE_URL
fi

echo "Rodando migrations..."
RETRIES=5
until NODE_PATH=/app/migrate/node_modules /app/migrate/node_modules/.bin/drizzle-kit push || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "Migration falhou, aguardando banco... ($RETRIES tentativas restantes)"
  sleep 5
done

if [ "$RETRIES" -eq 0 ]; then
  echo "Aviso: migrations nao foram aplicadas"
fi

exec "$@"
