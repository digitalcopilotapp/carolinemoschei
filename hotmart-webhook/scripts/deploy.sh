#!/bin/bash
# ============================================
# Script de deploy para a VPS
# ============================================
# Uso: scp para a VPS e rodar: bash deploy.sh
#
# Pré-requisitos na VPS:
# - Docker e Docker Compose instalados
# - Subdomínio webhook.carolinemoschei.site apontando para o IP da VPS

set -e

echo "================================================"
echo "  DEPLOY: Hotmart Webhook → Brevo + Meta"
echo "================================================"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado."
    exit 1
fi

# Criar diretórios
mkdir -p logs

# Verificar .env
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "   Copie o .env.example: cp .env.example .env"
    echo "   Edite com suas chaves: nano .env"
    exit 1
fi

echo "📦 Construindo container..."
docker compose build --no-cache

echo ""
echo "🚀 Iniciando container..."
docker compose up -d

echo ""
echo "⏳ Aguardando inicialização..."
sleep 3

echo ""
echo "🔍 Status do container:"
docker compose ps

echo ""
echo "📋 Logs recentes:"
docker compose logs --tail=20

echo ""
echo "================================================"
echo "  ✅ DEPLOY CONCLUÍDO!"
echo ""
echo "  Endpoint: https://webhook.carolinemoschei.site/webhook/hotmart"
echo "  Health:   https://webhook.carolinemoschei.site/health"
echo ""
echo "  PRÓXIMOS PASSOS:"
echo "  1. Configurar proxy reverso no CyberPanel"
echo "  2. Rodar setup do Brevo: docker compose exec webhook node scripts/setup-brevo-attributes.js"
echo "  3. Configurar webhook na Hotmart"
echo "  4. Testar: bash scripts/test-webhook.sh https://webhook.carolinemoschei.site"
echo "================================================"
