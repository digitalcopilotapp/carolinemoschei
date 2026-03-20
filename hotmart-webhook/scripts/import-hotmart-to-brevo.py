#!/usr/bin/env python3
"""
Script para exportar TODOS os leads/vendas da Hotmart e enviar para o Brevo
via o webhook local. Isso reorganiza todos os contatos com atributos completos.

Uso: python3 scripts/import-hotmart-to-brevo.py
"""

import requests
import json
import time
import sys
import urllib.parse

# ============================================================
# CONFIGURAÇÃO
# ============================================================

HOTMART_CLIENT_ID = "1168ae95-d4c6-4193-954e-9d9b0dc99e65"
HOTMART_CLIENT_SECRET = "e33456d4-b2c5-4182-bf8a-c79eaab8edba"
HOTMART_BASIC = "Basic MTE2OGFlOTUtZDRjNi00MTkzLTk1NGUtOWQ5YjBkYzk5ZTY1OmUzMzQ1NmQ0LWIyYzUtNDE4Mi1iZjhhLWM3OWVhYWI4ZWRiYQ=="

WEBHOOK_URL = "https://webhook.carolinemoschei.site/webhook/hotmart"
HOTTOK = "rmJqNRI4PU2Nrcnwisxzym46haTnev85a58f88-2eb2-4e62-a7ec-69fd38185d6e"

HOTMART_API = "https://developers.hotmart.com/payments/api/v1"
HOTMART_AUTH = "https://api-sec-vlc.hotmart.com/security/oauth/token"

# ============================================================
# AUTH
# ============================================================

def get_token():
    r = requests.post(
        f"{HOTMART_AUTH}?grant_type=client_credentials&client_id={HOTMART_CLIENT_ID}&client_secret={HOTMART_CLIENT_SECRET}",
        headers={
            "Authorization": HOTMART_BASIC,
            "Content-Type": "application/json",
        },
    )
    r.raise_for_status()
    token = r.json()["access_token"]
    # URL decode the token (Hotmart returns it encoded)
    token = urllib.parse.unquote(token)
    print(f"✅ Token obtido (expira em {r.json()['expires_in']}s)")
    return token


# ============================================================
# EXPORT SALES
# ============================================================

def get_all_sales(token, status=None, start_date=None, end_date=None):
    """
    Puxa todas as vendas da Hotmart com paginação.
    Status possíveis: APPROVED, REFUNDED, CANCELLED, CHARGEBACK, WAITING_PAYMENT, etc.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    all_items = []
    page_token = None
    page = 0

    params = {}
    if status:
        params["transaction_status"] = status
    if start_date:
        params["start_date"] = start_date  # timestamp em milissegundos
    if end_date:
        params["end_date"] = end_date

    while True:
        page += 1
        if page_token:
            params["page_token"] = page_token

        r = requests.get(
            f"{HOTMART_API}/sales/history",
            headers=headers,
            params=params,
        )

        if r.status_code == 401:
            print("⚠️ Token expirado, renovando...")
            token = get_token()
            headers["Authorization"] = f"Bearer {token}"
            continue

        if r.status_code != 200:
            print(f"❌ Erro API: {r.status_code} - {r.text[:200]}")
            break

        data = r.json()
        items = data.get("items", [])
        all_items.extend(items)

        page_info = data.get("page_info", {})
        total = page_info.get("total_results", "?")
        next_page = page_info.get("next_page_token")

        print(f"  Página {page}: +{len(items)} vendas (total acumulado: {len(all_items)}/{total})")

        if not next_page or not items:
            break

        page_token = next_page
        time.sleep(0.3)  # Rate limiting

    return all_items, token


# ============================================================
# MAP HOTMART STATUS → WEBHOOK EVENT
# ============================================================

STATUS_TO_EVENT = {
    "APPROVED": "PURCHASE_COMPLETE",
    "COMPLETE": "PURCHASE_COMPLETE",
    "REFUNDED": "PURCHASE_REFUNDED",
    "CANCELLED": "PURCHASE_CANCELED",
    "CHARGEBACK": "PURCHASE_CHARGEBACK",
    "DISPUTE": "PURCHASE_DISPUTE",
    "WAITING_PAYMENT": "PURCHASE_WAITING_PAYMENT",
    "PRINTED_BILLET": "PURCHASE_BILLET_PRINTED",
    "OVERDUE": "PURCHASE_DELAYED",
    "DELAYED": "PURCHASE_DELAYED",
    "PROTEST": "PURCHASE_PROTEST",
    "PRE_ORDER": "PURCHASE_WAITING_PAYMENT",
    "STARTED": "PURCHASE_OUT_OF_SHOPPING_CART",
    "BLOCKED": "PURCHASE_CANCELED",
    "NO_FUNDS": "PURCHASE_DELAYED",
}


def sale_to_webhook_payload(sale):
    """Converte uma venda da API Hotmart para o formato do nosso webhook."""
    buyer = sale.get("buyer", {})
    product = sale.get("product", {})
    purchase = sale.get("purchase", {})
    payment = purchase.get("payment", {})

    status = purchase.get("status", "UNKNOWN")
    event = STATUS_TO_EVENT.get(status, f"PURCHASE_STATUS_{status}")

    # Extrair nome/sobrenome
    name = buyer.get("name", "")

    # Extrair telefone
    phone_data = purchase.get("checkout_phone", {}) or {}
    phone = ""
    if isinstance(phone_data, dict):
        local = phone_data.get("local_code", "")
        number = phone_data.get("number", "")
        if local and number:
            phone = f"{local}{number}"
    elif isinstance(phone_data, str):
        phone = phone_data

    # Preço
    price = purchase.get("price", {})
    if isinstance(price, dict):
        value = price.get("value", 0)
        currency = price.get("currency_code", "BRL")
    else:
        value = float(price) if price else 0
        currency = "BRL"

    # Offer
    offer = purchase.get("offer", {}) or {}
    offer_code = offer.get("code", "") if isinstance(offer, dict) else ""

    # Recurrence
    recurrence = purchase.get("recurrence_number", 0)
    is_subscription = bool(purchase.get("subscription"))

    return {
        "hottok": HOTTOK,
        "event": event,
        "data": {
            "buyer": {
                "email": buyer.get("email", ""),
                "name": name,
                "checkout_phone": phone,
                "document": buyer.get("document", ""),
            },
            "product": {
                "id": product.get("id", ""),
                "name": product.get("name", ""),
                "ucode": product.get("ucode", ""),
            },
            "purchase": {
                "transaction": purchase.get("transaction", ""),
                "status": status,
                "price": value,
                "payment": {
                    "currency_value": currency,
                    "type": payment.get("type", ""),
                    "method": payment.get("method", ""),
                },
                "offer": {"code": offer_code},
                "recurrence_number": recurrence,
                "order_date": purchase.get("order_date", ""),
                "approved_date": purchase.get("approved_date", ""),
            },
            "subscription": {
                "plan": purchase.get("subscription", {}).get("plan", {}).get("name", "") if purchase.get("subscription") else "",
                "status": purchase.get("subscription", {}).get("status", "") if purchase.get("subscription") else "",
                "subscriber_code": purchase.get("subscription", {}).get("subscriber", {}).get("code", "") if purchase.get("subscription") else "",
            },
        },
    }


# ============================================================
# SEND TO WEBHOOK
# ============================================================

def send_to_webhook(payload):
    """Envia para o nosso webhook que processa Brevo + Meta."""
    try:
        r = requests.post(WEBHOOK_URL, json=payload, timeout=30)
        return r.status_code == 200, r.json() if r.status_code == 200 else r.text
    except Exception as e:
        return False, str(e)


# ============================================================
# HOTLEADS (leads capturados pela Hotmart)
# ============================================================

def get_hotleads(token):
    """Puxa todos os HotLeads da Hotmart."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    all_leads = []
    page_token = None
    page = 0

    while True:
        page += 1
        params = {}
        if page_token:
            params["page_token"] = page_token

        r = requests.get(
            f"{HOTMART_API}/sales/users",
            headers=headers,
            params=params,
        )

        if r.status_code == 401:
            print("⚠️ Token expirado, renovando...")
            token = get_token()
            headers["Authorization"] = f"Bearer {token}"
            continue

        if r.status_code != 200:
            print(f"  ❌ Erro HotLeads: {r.status_code} - {r.text[:200]}")
            break

        data = r.json()
        items = data.get("items", [])
        all_leads.extend(items)

        page_info = data.get("page_info", {})
        total = page_info.get("total_results", "?")
        next_page = page_info.get("next_page_token")

        print(f"  Página {page}: +{len(items)} leads (total: {len(all_leads)}/{total})")

        if not next_page or not items:
            break

        page_token = next_page
        time.sleep(0.3)

    return all_leads, token


def get_subscriptions(token):
    """Puxa todas as assinaturas da Hotmart."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    all_subs = []
    page_token = None
    page = 0

    while True:
        page += 1
        params = {}
        if page_token:
            params["page_token"] = page_token

        r = requests.get(
            f"{HOTMART_API}/subscriptions",
            headers=headers,
            params=params,
        )

        if r.status_code == 401:
            token = get_token()
            headers["Authorization"] = f"Bearer {token}"
            continue

        if r.status_code != 200:
            print(f"  ❌ Erro Subscriptions: {r.status_code} - {r.text[:200]}")
            break

        data = r.json()
        items = data.get("items", [])
        all_subs.extend(items)

        page_info = data.get("page_info", {})
        next_page = page_info.get("next_page_token")
        total = page_info.get("total_results", "?")

        print(f"  Página {page}: +{len(items)} assinaturas (total: {len(all_subs)}/{total})")

        if not next_page or not items:
            break

        page_token = next_page
        time.sleep(0.3)

    return all_subs, token


def hotlead_to_webhook_payload(lead):
    """Converte HotLead para formato do webhook (como lead/interesse)."""
    return {
        "hottok": HOTTOK,
        "event": "PURCHASE_OUT_OF_SHOPPING_CART",
        "data": {
            "buyer": {
                "email": lead.get("email", "") or lead.get("buyer_email", ""),
                "name": lead.get("name", "") or lead.get("buyer_name", ""),
                "checkout_phone": lead.get("phone", "") or lead.get("checkout_phone", ""),
            },
            "product": {
                "id": lead.get("product_id", "") or lead.get("product", {}).get("id", ""),
                "name": lead.get("product_name", "") or lead.get("product", {}).get("name", ""),
            },
            "purchase": {
                "transaction": lead.get("transaction", ""),
                "price": 0,
            },
        },
    }


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  IMPORTAÇÃO HOTMART → BREVO")
    print("  Vendas + HotLeads + Assinaturas")
    print("=" * 60)
    print()

    # 1. Autenticar
    token = get_token()

    # 2. Puxar TODAS as vendas (todos os status)
    statuses = [
        ("APPROVED", "Vendas aprovadas"),
        ("REFUNDED", "Reembolsos"),
        ("CANCELLED", "Canceladas"),
        ("CHARGEBACK", "Chargebacks"),
        ("WAITING_PAYMENT", "Aguardando pagamento"),
        ("PRINTED_BILLET", "Boletos impressos"),
        ("OVERDUE", "Pagamentos atrasados"),
        ("STARTED", "Checkouts iniciados (não finalizados)"),
        ("NO_FUNDS", "Sem fundos"),
        ("PROTEST", "Protestos"),
        ("DELAYED", "Atrasados"),
        ("PRE_ORDER", "Pré-venda"),
    ]

    all_sales = []
    for status_code, label in statuses:
        print(f"\n📦 Buscando: {label} ({status_code})...")
        sales, token = get_all_sales(token, status=status_code)
        if sales:
            all_sales.extend(sales)
            print(f"  → {len(sales)} encontradas")
        else:
            print(f"  → Nenhuma")

    # 3. Puxar HotLeads
    print(f"\n🔥 Buscando HotLeads...")
    hotleads, token = get_hotleads(token)
    print(f"  → {len(hotleads)} HotLeads encontrados")

    # 4. Puxar Assinaturas
    print(f"\n🔄 Buscando Assinaturas...")
    subscriptions, token = get_subscriptions(token)
    print(f"  → {len(subscriptions)} assinaturas encontradas")

    print(f"\n{'=' * 60}")
    print(f"  TOTAL: {len(all_sales)} vendas + {len(hotleads)} HotLeads + {len(subscriptions)} assinaturas")
    print(f"{'=' * 60}")

    # Ordenar vendas por data (mais antigas primeiro → mais recentes sobrepõem)
    all_sales.sort(key=lambda x: x.get("purchase", {}).get("order_date", 0) or 0)

    # ========== ENVIAR VENDAS ==========
    success = 0
    errors = 0
    total_items = len(all_sales) + len(hotleads)

    if all_sales:
        print(f"\n🚀 Enviando {len(all_sales)} vendas para o webhook...")
        for i, sale in enumerate(all_sales, 1):
            buyer_email = sale.get("buyer", {}).get("email", "")
            product_name = sale.get("product", {}).get("name", "")
            status = sale.get("purchase", {}).get("status", "")

            if not buyer_email:
                continue

            payload = sale_to_webhook_payload(sale)
            ok, result = send_to_webhook(payload)

            if ok:
                success += 1
                if i % 50 == 0 or i <= 5 or i == len(all_sales):
                    print(f"  [{i}/{len(all_sales)}] ✅ {buyer_email[:25]:25s} | {status:20s} | {product_name[:35]}")
            else:
                errors += 1
                if errors <= 10:
                    print(f"  [{i}/{len(all_sales)}] ❌ {buyer_email[:25]:25s} | Erro: {str(result)[:60]}")

            if i % 10 == 0:
                time.sleep(0.2)

    # ========== ENVIAR HOTLEADS ==========
    if hotleads:
        print(f"\n🔥 Enviando {len(hotleads)} HotLeads para o webhook...")
        leads_success = 0
        leads_errors = 0

        for i, lead in enumerate(hotleads, 1):
            email = lead.get("email", "") or lead.get("buyer_email", "")
            if not email:
                continue

            payload = hotlead_to_webhook_payload(lead)
            ok, result = send_to_webhook(payload)

            if ok:
                leads_success += 1
                success += 1
                if i % 50 == 0 or i <= 5 or i == len(hotleads):
                    pname = lead.get("product_name", "") or lead.get("product", {}).get("name", "")
                    print(f"  [{i}/{len(hotleads)}] ✅ {email[:25]:25s} | HOTLEAD | {pname[:35]}")
            else:
                leads_errors += 1
                errors += 1

            if i % 10 == 0:
                time.sleep(0.2)

        print(f"  HotLeads: {leads_success} ok, {leads_errors} erros")

    # ========== RESUMO ==========
    print(f"\n{'=' * 60}")
    print(f"  IMPORTAÇÃO CONCLUÍDA!")
    print(f"  ✅ Sucesso: {success}")
    print(f"  ❌ Erros:   {errors}")
    print(f"  📊 Vendas:   {len(all_sales)}")
    print(f"  🔥 HotLeads: {len(hotleads)}")
    print(f"  🔄 Assinaturas: {len(subscriptions)}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
