#!/bin/sh

echo "Rodando migrations..."
RETRIES=5
until /app/migrate/node_modules/.bin/drizzle-kit push || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "Migration falhou, aguardando banco... ($RETRIES tentativas restantes)"
  sleep 5
done

if [ "$RETRIES" -eq 0 ]; then
  echo "Aviso: migrations nao foram aplicadas"
fi

exec "$@"
