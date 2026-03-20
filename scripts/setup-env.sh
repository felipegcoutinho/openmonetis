#!/bin/bash

# Script para configurar ambiente de forma segura
# Cria backup do .env atual antes de sobrescrever

set -e

echo "🔧 Configurando ambiente..."

# Se .env já existe, criar backup
if [ -f .env ]; then
  BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
  echo "⚠️  Arquivo .env existente detectado!"
  echo "📦 Criando backup em: $BACKUP_FILE"
  cp .env "$BACKUP_FILE"
  echo "✅ Backup criado com sucesso!"
  echo ""
  read -p "Deseja sobrescrever o .env atual com .env.example? (s/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada. Seu .env não foi modificado."
    exit 0
  fi
fi

# Copiar .env.example para .env
if [ -f .env.example ]; then
  cp .env.example .env
  echo "✅ Arquivo .env criado a partir de .env.example"
else
  echo "❌ Erro: .env.example não encontrado!"
  exit 1
fi

# Gerar BETTER_AUTH_SECRET automaticamente
if command -v openssl &> /dev/null; then
  SECRET=$(openssl rand -base64 32)
  sed -i.bak "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$SECRET|" .env && rm -f .env.bak
  echo "✅ BETTER_AUTH_SECRET gerado automaticamente"
else
  echo "⚠️  openssl não encontrado — configure BETTER_AUTH_SECRET manualmente:"
  echo "   openssl rand -base64 32"
fi

echo ""
echo "⚠️  IMPORTANTE: Edite o arquivo .env e configure:"
echo "   - DATABASE_URL"
echo "   - BETTER_AUTH_URL"
echo "   - Demais variáveis opcionais (OAuth, e-mail, IA)"
