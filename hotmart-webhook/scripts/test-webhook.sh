#!/bin/bash
# ============================================
# Script para testar o webhook localmente
# ============================================
# Uso: ./scripts/test-webhook.sh [URL_BASE]
# Exemplo: ./scripts/test-webhook.sh https://webhook.carolinemoschei.site

URL="${1:-http://localhost:3001}"
HOTTOK="${HOTMART_HOTTOK:-seu_hottok_aqui}"

echo "🧪 Testando webhook em: $URL"
echo ""

# Teste 1: Health check
echo "=== Teste 1: Health Check ==="
curl -s "$URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$URL/health"
echo -e "\n"

# Teste 2: Compra aprovada (formato novo v2)
echo "=== Teste 2: Compra Aprovada ==="
curl -s -X POST "$URL/webhook/hotmart" \
  -H "Content-Type: application/json" \
  -d '{
    "hottok": "'$HOTTOK'",
    "event": "PURCHASE_COMPLETE",
    "data": {
      "buyer": {
        "email": "teste@exemplo.com",
        "name": "Maria Silva Teste",
        "checkout_phone": "11999998888"
      },
      "product": {
        "id": 12345,
        "name": "Guia de Poses Corporativo",
        "ucode": "abc123"
      },
      "purchase": {
        "transaction": "TRX-TEST-001",
        "status": "COMPLETE",
        "price": 297.00,
        "payment": {
          "currency_value": "BRL",
          "type": "CREDIT_CARD"
        },
        "offer": {
          "code": "OFERTA01"
        }
      }
    }
  }' | python3 -m json.tool 2>/dev/null || echo "Resposta recebida"
echo -e "\n"

# Teste 3: Carrinho abandonado
echo "=== Teste 3: Carrinho Abandonado ==="
curl -s -X POST "$URL/webhook/hotmart" \
  -H "Content-Type: application/json" \
  -d '{
    "hottok": "'$HOTTOK'",
    "event": "PURCHASE_OUT_OF_SHOPPING_CART",
    "data": {
      "buyer": {
        "email": "lead-abandonou@exemplo.com",
        "name": "João Lead Teste",
        "checkout_phone": "21988887777"
      },
      "product": {
        "id": 12345,
        "name": "Guia de Poses Corporativo"
      },
      "purchase": {
        "transaction": "TRX-TEST-002",
        "price": 297.00
      }
    }
  }' | python3 -m json.tool 2>/dev/null || echo "Resposta recebida"
echo -e "\n"

# Teste 4: Boleto gerado
echo "=== Teste 4: Boleto Gerado ==="
curl -s -X POST "$URL/webhook/hotmart" \
  -H "Content-Type: application/json" \
  -d '{
    "hottok": "'$HOTTOK'",
    "event": "PURCHASE_BILLET_PRINTED",
    "data": {
      "buyer": {
        "email": "boleto@exemplo.com",
        "name": "Ana Boleto Teste",
        "checkout_phone": "31977776666"
      },
      "product": {
        "id": 67890,
        "name": "Preset Pack Premium"
      },
      "purchase": {
        "transaction": "TRX-TEST-003",
        "price": 147.00,
        "payment": {
          "type": "BILLET"
        }
      }
    }
  }' | python3 -m json.tool 2>/dev/null || echo "Resposta recebida"
echo -e "\n"

echo "✅ Testes concluídos! Verifique os logs: docker compose logs -f"
