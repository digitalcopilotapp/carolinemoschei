#!/usr/bin/env python3
"""
Criar Campanha Completa Meta Ads - Guia de Viagem 2026
Usa a Graph API diretamente para criar ad sets, upload de imagens, criativos e anuncios.

Estrutura Andromeda 2026:
- 1 Campanha CBO (Advantage Campaign Budget) R$100/dia
- 5 Ad Sets (1 por estagio do funil), sem budget individual
- 30 Anuncios FLEX/DOF (Advantage+ Creative)

Executar: python criar-campanha-meta.py --token SEU_ACCESS_TOKEN
"""

import os
import sys
import json
import base64
import time
import argparse
import glob as glob_mod
from pathlib import Path

try:
    import requests
except ImportError:
    print("Instalando requests...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests

# ============================================================
# CONFIGURACAO
# ============================================================

ACCOUNT_ID = "act_1080486722552440"
CAMPAIGN_ID = None  # Sera criado automaticamente como CBO
PAGE_ID = "515416671875240"
INSTAGRAM_ACTOR_ID = "17841400894663689"
PIXEL_ID = "1559920731501893"
API_VERSION = "v24.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"

LINK_URL = "https://carolinemoschei.site/collab-guia-pessoal-de-viagem/"
URL_TAGS = "utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}&xcod=FBhQwK21wXxR{{campaign.name}}|{{campaign.id}}hQwK21wXxR{{adset.name}}|{{adset.id}}hQwK21wXxR{{ad.name}}|{{ad.id}}hQwK21wXxR{{placement}}"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRIATIVOS_BASE = os.path.join(
    SCRIPT_DIR, "ads", "criativos_raw",
    "Anuncios Guia Viagem 2026- Caroline Moschei e Jenniffer Thalia"
)

# Encontrar pasta 03 com encoding especial
stage03_matches = glob_mod.glob(os.path.join(CRIATIVOS_BASE, "03*"))
STAGE03_FOLDER = os.path.basename(stage03_matches[0]) if stage03_matches else "03 - Solucao"

STAGE_FOLDERS = {
    "01": "01 - Inconsciente",
    "02": "02 - Problema",
    "03": STAGE03_FOLDER,
    "04": "04 - Produto",
    "05": "05 - Consciente",
}

# Stage 03 variantes: pasta V11 tem arquivo VAR08, V12->VAR09, V13->VAR10
STAGE03_FILE_MAP = {"V11": "VAR08", "V12": "VAR09", "V13": "VAR10"}

# ============================================================
# TOP 30 CRIATIVOS SELECIONADOS
# ============================================================

TOP30 = [
    # Stage 01 - Inconsciente (8)
    {"stage": "01", "tipo": "Cards", "versao": "V01"},
    {"stage": "01", "tipo": "Cards", "versao": "V02"},
    {"stage": "01", "tipo": "Cards", "versao": "V03"},
    {"stage": "01", "tipo": "Cards", "versao": "V08"},
    {"stage": "01", "tipo": "Mosaico", "versao": "V01"},
    {"stage": "01", "tipo": "Mosaico", "versao": "V02"},
    {"stage": "01", "tipo": "Mosaico", "versao": "V03"},
    {"stage": "01", "tipo": "Mosaico", "versao": "V04"},
    # Stage 02 - Problema (8)
    {"stage": "02", "tipo": "Cards", "versao": "V01"},
    {"stage": "02", "tipo": "Cards", "versao": "V02"},
    {"stage": "02", "tipo": "Cards", "versao": "V03"},
    {"stage": "02", "tipo": "Cards", "versao": "V06"},
    {"stage": "02", "tipo": "Mosaico", "versao": "V01"},
    {"stage": "02", "tipo": "Mosaico", "versao": "V02"},
    {"stage": "02", "tipo": "Mosaico", "versao": "V03"},
    {"stage": "02", "tipo": "Mosaico", "versao": "V04"},
    # Stage 03 - Solucao (4)
    {"stage": "03", "tipo": "Cards", "versao": "V09"},
    {"stage": "03", "tipo": "Cards", "versao": "V10"},
    {"stage": "03", "tipo": "Cards", "versao": "V12"},
    {"stage": "03", "tipo": "Cards", "versao": "V13"},
    # Stage 04 - Produto (6)
    {"stage": "04", "tipo": "Cards", "versao": "V01"},
    {"stage": "04", "tipo": "Cards", "versao": "V02"},
    {"stage": "04", "tipo": "Cards", "versao": "V03"},
    {"stage": "04", "tipo": "Cards", "versao": "V04"},
    {"stage": "04", "tipo": "Cards", "versao": "V06"},
    {"stage": "04", "tipo": "Cards", "versao": "V07"},
    # Stage 05 - Consciente (4)
    {"stage": "05", "tipo": "Cards", "versao": "V01"},
    {"stage": "05", "tipo": "Cards", "versao": "V02"},
    {"stage": "05", "tipo": "Cards", "versao": "V05"},
    {"stage": "05", "tipo": "Cards", "versao": "V06"},
]

# ============================================================
# COPIES POR ESTAGIO (Primary Text)
# ============================================================

COPIES = {
    "01": {
        "default": (
            "Você viaja, tira centenas de fotos... e quando volta, não gosta de nenhuma.\n\n"
            "Ângulo errado. Pose forçada. Roupa que não combinou com o cenário. Luz estourada.\n\n"
            "É a sensação de que desperdiçou momentos únicos que nunca mais vão se repetir.\n\n"
            "Foi pensando nisso que a Caroline Moschei (fotógrafa há 12 anos, 10+ países) e a "
            "Jenniffer Thalia (consultora de imagem formada na Marangoni de Milão) criaram o "
            "Guia de Poses e Fotos de Viagem.\n\n"
            "105 páginas com +100 poses por cenário, guia de looks por destino, técnicas de luz "
            "e ângulo — tudo pra você nunca mais voltar de viagem frustrada com suas fotos.\n\n"
            "De R$ 159,80 por apenas R$ 79,90 (ou 12x R$ 7,99)\n"
            "7 dias de garantia incondicional.\n\n"
            "Toque em \"Saiba Mais\" e garanta o seu."
        ),
        "alt": (
            "Tem uma coisa que separa as fotos de viagem que você ama das que você esconde...\n\n"
            "Não é a câmera.\nNão é o destino.\nNão é nem o fotógrafo.\n\n"
            "É saber COMO se posicionar, o que vestir e quando apertar o botão.\n\n"
            "E isso ninguém te ensinou — até agora.\n\n"
            "O Guia de Poses e Fotos de Viagem tem 105 páginas com tudo que você precisa pra "
            "transformar qualquer cenário em uma foto que você vai AMAR.\n\n"
            "Preço de lançamento: R$ 79,90 (50% OFF)"
        ),
    },
    "02": {
        "default": (
            "+20 mil mulheres já transformaram suas fotos de viagem com esse guia.\n\n"
            "E não é exagero.\n\n"
            "Caroline Moschei fotografa profissionalmente há mais de 12 anos em mais de 10 países. "
            "Jenniffer Thalia é consultora de imagem formada no Istituto Marangoni de Milão e "
            "seguida por 2.4 milhões de mulheres.\n\n"
            "Juntas, elas criaram um guia de 105 páginas que ensina:\n\n"
            "- +100 variações de pose por cenário\n"
            "- Looks ideais para cada destino (Paris, Milão, Miami...)\n"
            "- Técnicas de golden hour e iluminação\n"
            "- Ângulos que valorizam qualquer tipo de corpo\n"
            "- Composição e narrativa visual\n\n"
            "Tudo isso por apenas R$ 79,90.\n\n"
            "Acesso imediato + garantia de 7 dias."
        ),
        "alt": (
            "Se você se identifica com PELO MENOS uma dessas situações:\n\n"
            "- Não sabe o que fazer com as mãos nas fotos\n"
            "- Escolhe roupas que não combinam com o cenário\n"
            "- Suas fotos sempre saem com ângulo estranho\n"
            "- Perde a melhor luz porque não sabe o horário certo\n"
            "- Volta de viagem sem nenhuma foto que ame\n"
            "- Fica travada na frente da câmera\n\n"
            "...esse guia foi feito EXATAMENTE pra você.\n\n"
            "105 páginas. +100 poses. 10+ países. Guia de looks por destino.\n\n"
            "Criado por uma fotógrafa profissional + consultora de imagem da Marangoni.\n\n"
            "R$ 79,90 | Acesso imediato | Garantia de 7 dias"
        ),
    },
    "03": {
        "default": (
            "A Caroline já fotografou em mais de 10 países.\n\n"
            "A Jenniffer se formou em consultoria de imagem em Milão e tem 2.4 milhões de seguidoras.\n\n"
            "Mas as duas perceberam a mesma coisa: a maioria das mulheres que viajam voltam "
            "FRUSTRADAS com suas fotos.\n\n"
            "\"Não sei posar.\"\n\"Escolhi a roupa errada.\"\n\"A luz tava horrível.\"\n\n"
            "Então elas decidiram resolver isso de uma vez.\n\n"
            "Criaram um guia de 105 páginas com TUDO que você precisa: poses, ângulos, looks, "
            "iluminação, composição e até recomendações de restaurantes fotogênicos em cada destino.\n\n"
            "Preço de lançamento: R$ 79,90 (metade do preço)\n"
            "Garantia: 7 dias ou seu dinheiro de volta."
        ),
    },
    "04": {
        "default": (
            "Guia Digital de Poses e Fotos de Viagem\n\n"
            "105 páginas com:\n"
            "- +100 poses por cenário\n"
            "- Guia de looks para Paris, Milão, Miami e mais 7 destinos\n"
            "- Técnicas de golden hour e iluminação natural\n"
            "- Ângulos e composição que funcionam\n"
            "- Recomendações de restaurantes e cafés fotogênicos\n"
            "- Acesso vitalício + downloads ilimitados\n\n"
            "Criado por Caroline Moschei (fotógrafa, 12+ anos) e Jenniffer Thalia "
            "(consultora de imagem, Marangoni Milan).\n\n"
            "+20 mil alunas.\n\n"
            "De R$ 159,80 por R$ 79,90\n"
            "12x R$ 7,99 | Garantia de 7 dias\n\n"
            "Acesso imediato após a compra."
        ),
    },
    "05": {
        "default": (
            "Se você já pensou em comprar o Guia de Poses e Fotos de Viagem...\n\n"
            "Esse é o momento.\n\n"
            "O preço de lançamento de R$ 79,90 (50% OFF) não vai durar muito.\n\n"
            "São 105 páginas criadas por uma fotógrafa profissional e uma consultora de imagem "
            "formada em Milão — com +100 poses, guia de looks e técnicas que +20 mil mulheres já usam.\n\n"
            "Você pode continuar voltando de viagem frustrada com suas fotos...\n\n"
            "Ou pode resolver isso agora por menos de R$ 80.\n\n"
            "Escolha."
        ),
    },
}

# ============================================================
# HEADLINES POR ESTAGIO (3-5 para Advantage+ Creative testar)
# ============================================================

HEADLINES = {
    "01": [
        "Suas fotos de viagem vão mudar pra sempre",
        "O segredo das fotos perfeitas de viagem",
        "Isso muda tudo nas suas fotos",
        "Ninguém te ensinou isso sobre fotos",
        "Descubra o que faltava nas suas fotos",
    ],
    "02": [
        "Cansada de odiar suas fotos de viagem?",
        "Já voltou de viagem sem nenhuma foto boa?",
        "Sabe por que suas fotos não ficam boas?",
        "Você está posando errado (e nem sabe)",
        "Pare de desperdiçar suas fotos de viagem",
    ],
    "03": [
        "Fotos incríveis sem saber fotografar",
        "Poses perfeitas em qualquer destino",
        "Guia completo: poses, looks e destinos",
        "+100 poses para suas fotos de viagem",
        "Looks + Poses + Ângulos = Foto perfeita",
    ],
    "04": [
        "105 páginas que transformam suas fotos",
        "De amadora a profissional em 1 guia",
        "Seu guia pessoal de fotos de viagem",
        "Criado por fotógrafa com 12 anos de experiência",
        "+20 mil alunas já transformaram suas fotos",
    ],
    "05": [
        "De R$ 159 por apenas R$ 79,90",
        "Oferta de lançamento: 50% OFF",
        "12x R$ 7,99 - Acesso imediato",
        "Garanta antes que o preço suba",
        "Preço de lançamento por tempo limitado",
    ],
}

DESCRIPTIONS = {
    "01": ["Guia completo 105 páginas", "+100 poses de viagem", "Descubra o que faltava"],
    "02": ["+20 mil alunas aprovam", "Poses + Looks + Destinos", "Transforme suas fotos"],
    "03": ["Por Caroline e Jenniffer", "Guia completo 105 páginas", "Acesso imediato ao guia"],
    "04": ["Acesso imediato ao guia", "12x R$ 7,99 sem juros", "Garantia de 7 dias"],
    "05": ["50% OFF - Lançamento", "Acesso imediato ao guia", "Garantia de 7 dias"],
}

CTA_MAP = {
    "01": "LEARN_MORE",
    "02": "LEARN_MORE",
    "03": "SHOP_NOW",
    "04": "SHOP_NOW",
    "05": "SHOP_NOW",
}

# ============================================================
# API HELPERS
# ============================================================

def api_post(endpoint, data, token, files=None):
    """POST to Graph API with error handling."""
    url = f"{BASE_URL}/{endpoint}"
    data["access_token"] = token
    resp = requests.post(url, data=data, files=files)
    result = resp.json()
    if "error" in result:
        print(f"  ERRO: {result['error'].get('message', result['error'])}")
        return None
    return result


def api_get(endpoint, params, token):
    """GET from Graph API."""
    url = f"{BASE_URL}/{endpoint}"
    params["access_token"] = token
    resp = requests.get(url, params=params)
    return resp.json()


# ============================================================
# STEP 0: CREATE CAMPAIGN (CBO)
# ============================================================

def create_campaign(token, daily_budget_cents=10000):
    """Create CBO campaign with Advantage Campaign Budget.

    Args:
        daily_budget_cents: Budget in centavos. Default R$100/dia = 10000
    """
    print(f"  Criando campanha CBO: R${daily_budget_cents/100:.0f}/dia...")

    data = {
        "name": "GV26 | Guia Viagem | CBO | Advantage+",
        "objective": "OUTCOME_SALES",
        "status": "PAUSED",
        "special_ad_categories": "[]",
        "buying_type": "AUCTION",
        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
        "daily_budget": str(daily_budget_cents),
    }

    result = api_post(f"{ACCOUNT_ID}/campaigns", data, token)
    if result:
        campaign_id = result["id"]
        print(f"    OK: {campaign_id}")
        return campaign_id
    else:
        print("    FALHOU!")
        return None


# ============================================================
# STEP 1: CREATE AD SETS (sem budget - CBO distribui)
# ============================================================

def create_ad_sets(token, campaign_id):
    """Create 5 ad sets, one per funnel stage. No individual budget (CBO manages)."""
    adset_names = {
        "01": "AS1_Inconsciente | Broad | W18-65",
        "02": "AS2_Problema | Broad | W18-65",
        "03": "AS3_Solucao | Broad | W18-65",
        "04": "AS4_Produto | Broad | W18-65",
        "05": "AS5_Consciente | Broad | W18-65",
    }

    adset_ids = {}

    for stage, name in adset_names.items():
        print(f"  Criando ad set: {name}...")

        targeting = {
            "geo_locations": {"countries": ["BR"]},
            "age_min": 18,
            "age_max": 65,
            "genders": [2],  # Women
            "targeting_automation": {"advantage_audience": 1},
        }

        data = {
            "campaign_id": campaign_id,
            "name": name,
            "optimization_goal": "OFFSITE_CONVERSIONS",
            "billing_event": "IMPRESSIONS",
            "status": "PAUSED",
            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
            "destination_type": "WEBSITE",
            "promoted_object": json.dumps({
                "pixel_id": PIXEL_ID,
                "custom_event_type": "PURCHASE",
            }),
            "targeting": json.dumps(targeting),
        }

        result = api_post(f"{ACCOUNT_ID}/adsets", data, token)
        if result:
            adset_ids[stage] = result["id"]
            print(f"    OK: {result['id']}")
        else:
            print(f"    FALHOU!")

        time.sleep(0.5)  # Rate limiting

    return adset_ids


# ============================================================
# STEP 2: UPLOAD IMAGES
# ============================================================

def get_image_path(creative, tema="Dark", formato="Stories"):
    """Get the local file path for a creative's image."""
    stage = creative["stage"]
    tipo = creative["tipo"]
    versao = creative["versao"]

    # Resolve filename for Stage 03 variantes
    file_versao = STAGE03_FILE_MAP.get(versao, versao) if stage == "03" else versao

    fmt_file = {"Feed Quadrado": "Feed_Quadrado", "Feed Retrato": "Feed_Retrato", "Stories": "Stories"}[formato]
    filename = f"{tipo}_{file_versao}_{tema}_{fmt_file}.png"

    stage_folder = STAGE_FOLDERS[stage]
    path = os.path.join(CRIATIVOS_BASE, stage_folder, tipo, versao, tema, formato, filename)
    return path


def upload_images(token):
    """Upload Dark Stories (9:16) images for all 30 creatives."""
    image_hashes = {}

    for i, creative in enumerate(TOP30):
        cid = f"S{creative['stage']}_{creative['tipo']}_{creative['versao']}"
        print(f"  [{i+1}/30] Uploading {cid}...")

        # Upload Dark Stories (primary format - 9:16 vertical)
        dark_path = get_image_path(creative, "Dark", "Stories")
        white_path = get_image_path(creative, "White", "Stories")

        hashes = {}

        for tema, path in [("Dark", dark_path), ("White", white_path)]:
            if not os.path.exists(path):
                print(f"    AVISO: Arquivo nao encontrado: {path}")
                continue

            with open(path, "rb") as f:
                img_data = f.read()

            img_name = f"{cid}_{tema}_Stories"

            result = api_post(
                f"{ACCOUNT_ID}/adimages",
                {"name": img_name},
                token,
                files={"filename": (f"{img_name}.png", img_data, "image/png")}
            )

            if result and "images" in result:
                img_info = list(result["images"].values())[0]
                hashes[tema] = img_info["hash"]
                print(f"    {tema}: {img_info['hash']}")
            else:
                print(f"    {tema}: FALHOU")

            time.sleep(0.3)

        image_hashes[cid] = hashes

    return image_hashes


# ============================================================
# STEP 3: CREATE AD CREATIVES (FLEX/DOF - Advantage+ Creative)
# ============================================================

def create_creatives(token, image_hashes):
    """Create FLEX (Advantage+ Creative) for each of the 30 ads."""
    creative_ids = {}

    for i, creative in enumerate(TOP30):
        stage = creative["stage"]
        cid = f"S{stage}_{creative['tipo']}_{creative['versao']}"
        hashes = image_hashes.get(cid, {})

        if not hashes:
            print(f"  [{i+1}/30] {cid}: SEM IMAGENS, pulando...")
            continue

        print(f"  [{i+1}/30] Criando creative FLEX: {cid}...")

        # Get copies for this stage
        copies_stage = COPIES[stage]
        messages = [copies_stage["default"]]
        if "alt" in copies_stage:
            messages.append(copies_stage["alt"])

        headlines = HEADLINES[stage]
        descriptions = DESCRIPTIONS[stage]
        cta = CTA_MAP[stage]

        # Build image_hashes list (Dark + White)
        img_hashes_list = []
        if "Dark" in hashes:
            img_hashes_list.append(hashes["Dark"])
        if "White" in hashes:
            img_hashes_list.append(hashes["White"])

        # Build asset_feed_spec for FLEX creative
        asset_feed_spec = {
            "images": [{"hash": h} for h in img_hashes_list],
            "bodies": [{"text": m} for m in messages],
            "titles": [{"text": h} for h in headlines],
            "descriptions": [{"text": d} for d in descriptions],
            "call_to_action_types": [cta],
            "link_urls": [{"website_url": LINK_URL}],
            "ad_formats": ["SINGLE_IMAGE"],
        }

        object_story_spec = {
            "page_id": PAGE_ID,
            "instagram_user_id": INSTAGRAM_ACTOR_ID,
        }

        data = {
            "name": f"CR_{cid} | FLEX | {cta}",
            "object_story_spec": json.dumps(object_story_spec),
            "asset_feed_spec": json.dumps(asset_feed_spec),
            "degrees_of_freedom_spec": json.dumps({
                "creative_features_spec": {
                    "standard_enhancements": {"enroll_status": "OPT_IN"},
                }
            }),
            "url_tags": URL_TAGS,
        }

        result = api_post(f"{ACCOUNT_ID}/adcreatives", data, token)
        if result:
            creative_ids[cid] = result["id"]
            print(f"    OK: {result['id']}")
        else:
            print(f"    FALHOU!")

        time.sleep(0.5)

    return creative_ids


# ============================================================
# STEP 4: CREATE ADS
# ============================================================

def create_ads(token, adset_ids, creative_ids):
    """Create 30 ads linking creatives to ad sets."""
    ad_ids = {}

    for i, creative in enumerate(TOP30):
        stage = creative["stage"]
        cid = f"S{stage}_{creative['tipo']}_{creative['versao']}"

        adset_id = adset_ids.get(stage)
        creative_id = creative_ids.get(cid)

        if not adset_id or not creative_id:
            print(f"  [{i+1}/30] {cid}: Faltando adset ou creative, pulando...")
            continue

        print(f"  [{i+1}/30] Criando ad: {cid}...")

        data = {
            "name": f"AD_{cid} | {creative['tipo']}_{creative['versao']}",
            "adset_id": adset_id,
            "creative": json.dumps({"creative_id": creative_id}),
            "status": "PAUSED",
            "tracking_specs": json.dumps([
                {
                    "action.type": ["offsite_conversion"],
                    "fb_pixel": [PIXEL_ID],
                }
            ]),
        }

        result = api_post(f"{ACCOUNT_ID}/ads", data, token)
        if result:
            ad_ids[cid] = result["id"]
            print(f"    OK: {result['id']}")
        else:
            print(f"    FALHOU!")

        time.sleep(0.3)

    return ad_ids


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Criar campanha Meta Ads - Guia de Viagem 2026")
    parser.add_argument("--token", required=True, help="Meta Graph API access token")
    parser.add_argument("--budget", type=int, default=100, help="Orcamento diario da campanha em reais (default: 100)")
    parser.add_argument("--campaign-id", help="ID da campanha existente (pula criacao)")
    parser.add_argument("--skip-adsets", action="store_true", help="Pular criacao de ad sets (se ja existem)")
    parser.add_argument("--skip-upload", action="store_true", help="Pular upload de imagens (se ja foram feitos)")
    parser.add_argument("--adset-ids", help="JSON com ad set IDs por stage (ex: '{\"01\":\"123\",\"02\":\"456\"}')")
    parser.add_argument("--image-hashes", help="Arquivo JSON com image hashes (gerado pelo upload)")
    args = parser.parse_args()

    token = args.token

    budget_reais = args.budget
    budget_centavos = budget_reais * 100

    print("=" * 60)
    print("CAMPANHA META ADS - GUIA DE VIAGEM 2026")
    print("Estrutura Andromeda 2026 - CBO + FLEX/DOF (Advantage+)")
    print("=" * 60)
    print(f"\nConta: {ACCOUNT_ID}")
    print(f"Pagina: {PAGE_ID}")
    print(f"Instagram: {INSTAGRAM_ACTOR_ID}")
    print(f"Pixel: {PIXEL_ID}")
    print(f"URL: {LINK_URL}")
    print(f"Orcamento: R${budget_reais}/dia (CBO)")
    print(f"Criativos: {len(TOP30)}")

    # Step 0: Create Campaign (CBO)
    print("\n" + "=" * 60)
    print(f"STEP 0: Criando Campanha CBO (R${budget_reais}/dia)")
    print("=" * 60)

    if args.campaign_id:
        campaign_id = args.campaign_id
        print(f"  Usando campanha existente: {campaign_id}")
    else:
        campaign_id = create_campaign(token, budget_centavos)
        if not campaign_id:
            print("  ERRO FATAL: Nao conseguiu criar campanha!")
            return

    # Step 1: Ad Sets
    print("\n" + "=" * 60)
    print("STEP 1: Criando Ad Sets (5)")
    print("=" * 60)

    if args.skip_adsets and args.adset_ids:
        adset_ids = json.loads(args.adset_ids)
        print(f"  Usando ad sets existentes: {adset_ids}")
    elif args.skip_adsets:
        print("  ERRO: --skip-adsets requer --adset-ids")
        return
    else:
        adset_ids = create_ad_sets(token, campaign_id)
        print(f"\n  Ad Sets criados: {json.dumps(adset_ids, indent=2)}")

    if len(adset_ids) < 5:
        print("  AVISO: Nem todos os ad sets foram criados!")

    # Step 2: Upload Images
    print("\n" + "=" * 60)
    print("STEP 2: Upload de Imagens (60 arquivos: 30 Dark + 30 White)")
    print("=" * 60)

    hashes_file = os.path.join(SCRIPT_DIR, "image-hashes.json")

    if args.skip_upload and args.image_hashes:
        with open(args.image_hashes, "r") as f:
            image_hashes = json.load(f)
        print(f"  Usando hashes existentes de: {args.image_hashes}")
    elif args.skip_upload and os.path.exists(hashes_file):
        with open(hashes_file, "r") as f:
            image_hashes = json.load(f)
        print(f"  Usando hashes existentes de: {hashes_file}")
    else:
        image_hashes = upload_images(token)
        # Salvar hashes para reusar
        with open(hashes_file, "w") as f:
            json.dump(image_hashes, f, indent=2)
        print(f"\n  Hashes salvos em: {hashes_file}")

    print(f"  Total de criativos com imagens: {len(image_hashes)}")

    # Step 3: Create Creatives
    print("\n" + "=" * 60)
    print("STEP 3: Criando Ad Creatives FLEX (30)")
    print("=" * 60)

    creative_ids = create_creatives(token, image_hashes)
    print(f"\n  Creatives criados: {len(creative_ids)}")

    # Step 4: Create Ads
    print("\n" + "=" * 60)
    print("STEP 4: Criando Anuncios (30)")
    print("=" * 60)

    ad_ids = create_ads(token, adset_ids, creative_ids)
    print(f"\n  Anuncios criados: {len(ad_ids)}")

    # Summary
    print("\n" + "=" * 60)
    print("RESUMO FINAL")
    print("=" * 60)
    print(f"  Campanha: {campaign_id} (CBO R${budget_reais}/dia)")
    print(f"  Ad Sets: {len(adset_ids)}")
    print(f"  Imagens: {sum(len(v) for v in image_hashes.values())} uploads")
    print(f"  Creatives: {len(creative_ids)}")
    print(f"  Anuncios: {len(ad_ids)}")
    print(f"\n  Status: TODOS PAUSADOS")
    print(f"  Acao: Revise no Ads Manager e ative quando pronto")
    print(f"\n  Orcamento: R${budget_reais}/dia (CBO distribui entre {len(adset_ids)} ad sets)")
    print(f"  Bid: Lowest Cost (sem cap) - Andromeda otimiza automaticamente")

    # Salvar IDs para referencia
    output = {
        "campaign_id": campaign_id,
        "adset_ids": adset_ids,
        "creative_ids": creative_ids,
        "ad_ids": ad_ids,
        "image_hashes": image_hashes,
    }
    ids_file = os.path.join(SCRIPT_DIR, "campaign-ids.json")
    with open(ids_file, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n  IDs salvos em: {ids_file}")


if __name__ == "__main__":
    main()
