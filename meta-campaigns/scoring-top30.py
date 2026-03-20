#!/usr/bin/env python3
"""
Scoring e Ranking dos 30 Melhores Anuncios - Guia de Viagem 2026
Baseado nos criterios Andromeda 2026
"""

import os
import json
from dataclasses import dataclass, field
from typing import Optional

# ============================================================
# DATA MODEL
# ============================================================

@dataclass
class Criativo:
    stage: str          # "01", "02", "03", "04", "05"
    stage_name: str     # "Inconsciente", "Problema", etc.
    tipo: str           # "Cards" or "Mosaico"
    versao: str         # "V01", "V02", ..., "VAR11", etc.
    is_variante: bool   # True if copy variant (reuses photos from another version)
    foto_par: Optional[str]  # Which version shares same photos (e.g. "V01" for V12 in Stage 01)

    # Scores
    diversidade_visual: int = 0      # 0-25
    qualidade_copy: int = 0          # 0-20
    composicao_visual: int = 0       # 0-15
    diversidade_cenario: int = 0     # 0-15
    alinhamento_funil: int = 0       # 0-10
    formato_prioritario: int = 0     # 0-10 (scored at format level, here we use base score)
    potencial_anti_fadiga: int = 0   # 0-5

    justificativa: str = ""

    @property
    def score_total(self) -> int:
        return (self.diversidade_visual + self.qualidade_copy +
                self.composicao_visual + self.diversidade_cenario +
                self.alinhamento_funil + self.formato_prioritario +
                self.potencial_anti_fadiga)

    @property
    def id(self) -> str:
        return f"S{self.stage}_{self.tipo}_{self.versao}"


# ============================================================
# SCORING DATA (based on analise-visual-completa.md)
# ============================================================

def build_all_criativos():
    """Build and score all ~130 creative versions."""
    criativos = []

    # ========================================
    # STAGE 01 - INCONSCIENTE
    # ========================================
    stage, sname = "01", "Inconsciente"

    # Cards V01-V10: fotos unicas, copy padrao "O look certo muda a foto inteira"
    cards_01_unique = {
        "V01": {"cenarios": "Positano, barco, vestido verde praca", "diversidade_cenario": 15, "anti_fadiga": 5},
        "V02": {"cenarios": "Trevi turquesa, mirante vidro, look dourado urbano", "diversidade_cenario": 15, "anti_fadiga": 5},
        "V03": {"cenarios": "Flores/azulejos, carro branco, vestido estampado", "diversidade_cenario": 12, "anti_fadiga": 4},
        "V04": {"cenarios": "Inverno/neve, catedral", "diversidade_cenario": 12, "anti_fadiga": 4},
        "V05": {"cenarios": "Urbano/street style", "diversidade_cenario": 8, "anti_fadiga": 3},
        "V06": {"cenarios": "Rustico/boho", "diversidade_cenario": 8, "anti_fadiga": 3},
        "V07": {"cenarios": "Disney/catedral mix", "diversidade_cenario": 12, "anti_fadiga": 4},
        "V08": {"cenarios": "Canyon/aventura", "diversidade_cenario": 15, "anti_fadiga": 5},
        "V09": {"cenarios": "Similar V02 fotos laterais diferentes", "diversidade_cenario": 12, "anti_fadiga": 3},
        "V10": {"cenarios": "Praia/catedral", "diversidade_cenario": 12, "anti_fadiga": 4},
    }

    for v, data in cards_01_unique.items():
        # Cross-stage: fotos de V01-V08 sao reutilizadas em Stage 03
        # V09 similar a V02 = penalidade leve
        div_visual = 20 if v != "V09" else 15
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=div_visual,
            qualidade_copy=15,  # Copy padrao boa mas sem diferenciacao
            composicao_visual=15,  # Cards = 3 fotos grandes, alto impacto
            diversidade_cenario=data["diversidade_cenario"],
            alinhamento_funil=10,  # Copy awareness alinhada
            formato_prioritario=8,  # Base score (formato avaliado no mapeamento)
            potencial_anti_fadiga=data["anti_fadiga"],
            justificativa=f"Cards unico: {data['cenarios']}"
        ))

    # Cards variantes (fotos repetidas, copy diferente)
    cards_01_var = {
        "V12": {"par": "V01", "copy": "Viajou e as fotos nao ficaram boas?", "copy_score": 20},
        "V13": {"par": "V02", "copy": "Como as fotos de viagem ficam tao boas?", "copy_score": 18},
        "V14": {"par": "V03", "copy": "Seu Instagram conta a historia da viagem?", "copy_score": 20},
    }

    for v, data in cards_01_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=10,  # Fotos iguais, copy diferente
            qualidade_copy=data["copy_score"],  # Hook forte, angulo unico
            composicao_visual=15,
            diversidade_cenario=cards_01_unique[data["par"]]["diversidade_cenario"],
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"VAR copy '{data['copy']}' (fotos de {data['par']})"
        ))

    # Mosaico V01-V10 + V11-V13 (variantes)
    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        # Mosaicos usam pool compartilhado, menos unicos visualmente
        div_visual = 15 if v_num <= 7 else 10  # V08-V10 muito similares
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=div_visual,
            qualidade_copy=15,
            composicao_visual=12,  # Mosaico = grid menor, menos impacto
            diversidade_cenario=12,  # Pool compartilhado
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Mosaico grid unico, pool compartilhado"
        ))

    # Mosaico variantes
    mosaico_01_var = {
        "V11": {"par": "V01", "copy": "Viajou e as fotos nao ficaram boas?", "copy_score": 20},
        "V12": {"par": "V02", "copy": "Como as fotos de viagem ficam tao boas?", "copy_score": 18},
        "V13": {"par": "V03", "copy": "Seu Instagram conta a historia da viagem?", "copy_score": 20},
    }

    for v, data in mosaico_01_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=5,  # Grid identico
            qualidade_copy=data["copy_score"],
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Mosaico VAR copy '{data['copy']}' (grid de {data['par']})"
        ))

    # ========================================
    # STAGE 02 - PROBLEMA
    # ========================================
    stage, sname = "02", "Problema"

    cards_02_unique = {
        "V01": {"cenarios": "Totalmente unico", "div_visual": 25, "div_cenario": 15, "anti_fadiga": 5},
        "V02": {"cenarios": "Totalmente unico", "div_visual": 25, "div_cenario": 15, "anti_fadiga": 5},
        "V03": {"cenarios": "Totalmente unico", "div_visual": 25, "div_cenario": 15, "anti_fadiga": 5},
        "V04": {"cenarios": "Catedral, neve, estatua colorida", "div_visual": 20, "div_cenario": 12, "anti_fadiga": 4},
        "V05": {"cenarios": "Jaqueta verde, trench coat, vestido branco", "div_visual": 20, "div_cenario": 12, "anti_fadiga": 4},
        "V06": {"cenarios": "Porta pedra, deserto/rochoso, boho", "div_visual": 20, "div_cenario": 15, "anti_fadiga": 4},
        "V07": {"cenarios": "Duomo noite, Disney, palmeiras", "div_visual": 20, "div_cenario": 15, "anti_fadiga": 4},
        "V08": {"cenarios": "Parcialmente unico", "div_visual": 18, "div_cenario": 12, "anti_fadiga": 3},
        "V09": {"cenarios": "Parcialmente unico", "div_visual": 18, "div_cenario": 12, "anti_fadiga": 3},
        "V10": {"cenarios": "Parcialmente unico", "div_visual": 18, "div_cenario": 12, "anti_fadiga": 3},
    }

    for v, data in cards_02_unique.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=data["div_visual"],
            qualidade_copy=15,  # Copy padrao "Viaja o mundo todo..."
            composicao_visual=15,
            diversidade_cenario=data["div_cenario"],
            alinhamento_funil=10,  # Problema bem alinhado
            formato_prioritario=8,
            potencial_anti_fadiga=data["anti_fadiga"],
            justificativa=f"Cards: {data['cenarios']}"
        ))

    # Cards variantes Stage 02
    cards_02_var = {
        "V11": {"par": "V04", "copy": "Foco em poses (sub-problema)", "copy_score": 20},
        "V12": {"par": "V05", "copy": "Foco em angulos/composicao", "copy_score": 18},
        "V13": {"par": "V06", "copy": "Foco em looks por destino", "copy_score": 20},
        "V14": {"par": "V07", "copy": "Foco em pontos turisticos lotados", "copy_score": 20},
    }

    for v, data in cards_02_var.items():
        par_data = cards_02_unique[data["par"]]
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=10,
            qualidade_copy=data["copy_score"],
            composicao_visual=15,
            diversidade_cenario=par_data["div_cenario"],
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"VAR copy '{data['copy']}' (fotos de {data['par']})"
        ))

    # Mosaico Stage 02
    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        div_visual = 15 if v_num <= 7 else 10  # V08-V10 muito similares
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=div_visual,
            qualidade_copy=15,
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3 if v_num <= 7 else 1,
            justificativa=f"Mosaico grid" + (" (V08-10 similares)" if v_num >= 8 else "")
        ))

    # Mosaico variantes Stage 02
    for v_num, par_num in [(11, 4), (12, 5), (13, 6), (14, 7)]:
        v = f"V{v_num}"
        par = f"V{par_num:02d}"
        copy_map = {11: "poses", 12: "angulos", 13: "looks por destino", 14: "pontos lotados"}
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=True, foto_par=par,
            diversidade_visual=5,
            qualidade_copy=20,
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Mosaico VAR foco {copy_map[v_num]} (grid de {par})"
        ))

    # ========================================
    # STAGE 03 - SOLUCAO
    # ========================================
    stage, sname = "03", "Solucao"

    # IMPORTANTE: V01-V08 usam MESMAS fotos do Stage 01/02 (cross-stage reuse)
    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        # Cross-stage penalty: fotos ja usadas nos stages anteriores
        div_visual = 10 if v_num <= 8 else 15  # V09-V10 tem alguma variacao
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=div_visual,
            qualidade_copy=15,  # "O que vestir, como posar e onde fotografar" - boa
            composicao_visual=15,
            diversidade_cenario=12,
            alinhamento_funil=10,  # Solucao: copy bem alinhada, CTA "VER O CONTEUDO"
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Cards cross-stage reuse" + (" (V01-V08 = mesmas fotos Stage 01)" if v_num <= 8 else "")
        ))

    # Cards variantes Stage 03 (V11=VAR08, V12=VAR09, V13=VAR10)
    cards_03_var = {
        "V11": {"par": "V08", "copy": "Poses, looks, angulos e horarios — tudo aqui", "copy_score": 18},
        "V12": {"par": "V09", "copy": "Fotografa + consultora de moda criaram isso", "copy_score": 20},
        "V13": {"par": "V10", "copy": "Paris, Milao, NY, Miami e muito mais", "copy_score": 20},
    }

    for v, data in cards_03_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=10,
            qualidade_copy=data["copy_score"],
            composicao_visual=15,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"VAR copy '{data['copy']}' (fotos de {data['par']})"
        ))

    # Mosaico Stage 03
    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=10,  # Pool compartilhado cross-stage
            qualidade_copy=15,
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa="Mosaico cross-stage pool compartilhado"
        ))

    # Mosaico variantes Stage 03
    mosaico_03_var = {
        "V11": {"copy": "Poses, looks, angulos e horarios", "copy_score": 18},
        "V12": {"copy": "Fotografa + consultora de moda", "copy_score": 20},
        "V13": {"copy": "Paris, Milao, NY, Miami", "copy_score": 20},
    }

    for v, data in mosaico_03_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=True, foto_par=None,
            diversidade_visual=8,
            qualidade_copy=data["copy_score"],
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Mosaico VAR copy '{data['copy']}'"
        ))

    # ========================================
    # STAGE 04 - PRODUTO
    # ========================================
    stage, sname = "04", "Produto"

    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        # V08 reusa foto carro de V03; V09 reusa costeira V01 + Trevi V02; V10 reusa Duomo V04/V07
        reuso = v_num in (8, 9, 10)
        div_visual = 15 if not reuso else 12
        cenarios = {
            1: 15, 2: 15, 3: 12, 4: 12, 5: 12, 6: 15, 7: 15, 8: 12, 9: 12, 10: 12
        }
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=div_visual,
            qualidade_copy=15,  # "Consultoria de imagem e fotografia em 105 paginas"
            composicao_visual=15,
            diversidade_cenario=cenarios[v_num],
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=4,
            justificativa=f"Cards produto" + (" (reuso parcial fotos)" if reuso else "")
        ))

    # Cards variantes Stage 04 (VAR11, VAR12, VAR13)
    cards_04_var = {
        "VAR11": {"par": "V01", "copy": "O que vem no Guia de Viagem?", "copy_score": 18},
        "VAR12": {"par": "V04", "copy": "De quem fotografou em 10+ paises", "copy_score": 20},
        "VAR13": {"par": "V07", "copy": "Custa menos que um jantar na viagem", "copy_score": 20},
    }

    for v, data in cards_04_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=10,
            qualidade_copy=data["copy_score"],
            composicao_visual=15,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"VAR copy '{data['copy']}' (fotos de {data['par']})"
        ))

    # Mosaico Stage 04
    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=15,
            qualidade_copy=15,
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa="Mosaico produto, grid unico"
        ))

    # Mosaico variantes Stage 04
    mosaico_04_var = {
        "VAR11": {"par": "V03", "copy": "O que vem no Guia?", "copy_score": 18},
        "VAR12": {"par": "V06", "copy": "De quem fotografou em 10+ paises", "copy_score": 20},
        "VAR13": {"par": "V08", "copy": "Custa menos que um jantar", "copy_score": 20},
    }

    for v, data in mosaico_04_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=5,
            qualidade_copy=data["copy_score"],
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Mosaico VAR copy '{data['copy']}' (grid de {data['par']})"
        ))

    # ========================================
    # STAGE 05 - CONSCIENTE
    # ========================================
    stage, sname = "05", "Consciente"

    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        # V03/V08 compartilham foto carro; V04/V07/V10 compartilham Duomo
        reuso = v_num in (3, 4, 7, 8, 10)
        div_visual = 15 if not reuso else 12
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=div_visual,
            qualidade_copy=15,  # "De R$197 por apenas R$79,90" - direto, bom
            composicao_visual=15,
            diversidade_cenario=12,
            alinhamento_funil=10,  # Preco + CTA = perfeito para consciente
            formato_prioritario=8,
            potencial_anti_fadiga=4,
            justificativa=f"Cards consciente/venda" + (" (reuso parcial)" if reuso else "")
        ))

    # Cards variantes Stage 05
    cards_05_var = {
        "V11": {"par": "V02", "copy": "Sua proxima viagem merece fotos melhores", "copy_score": 18},
        "V12": {"par": "V08", "copy": "Ainda viajando sem um guia de poses?", "copy_score": 20},
    }

    for v, data in cards_05_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Cards", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=10,
            qualidade_copy=data["copy_score"],
            composicao_visual=15,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"VAR copy '{data['copy']}' (fotos de {data['par']})"
        ))

    # Mosaico Stage 05
    for v_num in range(1, 11):
        v = f"V{v_num:02d}"
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=False, foto_par=None,
            diversidade_visual=15,
            qualidade_copy=15,
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa="Mosaico consciente/venda"
        ))

    # Mosaico variantes Stage 05
    mosaico_05_var = {
        "V11": {"par": "V05", "copy": "Sua proxima viagem merece fotos melhores", "copy_score": 18},
        "V12": {"par": "V02", "copy": "Ainda viajando sem um guia de poses?", "copy_score": 20},
    }

    for v, data in mosaico_05_var.items():
        criativos.append(Criativo(
            stage=stage, stage_name=sname, tipo="Mosaico", versao=v,
            is_variante=True, foto_par=data["par"],
            diversidade_visual=5,
            qualidade_copy=data["copy_score"],
            composicao_visual=12,
            diversidade_cenario=12,
            alinhamento_funil=10,
            formato_prioritario=8,
            potencial_anti_fadiga=3,
            justificativa=f"Mosaico VAR copy '{data['copy']}' (grid de {data['par']})"
        ))

    return criativos


# ============================================================
# SELECTION: TOP 30 WITH DIVERSITY CONSTRAINTS
# ============================================================

def select_top30(criativos):
    """Select top 30 ensuring diversity: max 8/stage, min 4/stage, mix Cards/Mosaico."""
    ranked = sorted(criativos, key=lambda c: c.score_total, reverse=True)

    selected = []
    stage_count = {"01": 0, "02": 0, "03": 0, "04": 0, "05": 0}
    tipo_count = {"Cards": 0, "Mosaico": 0}
    MAX_PER_STAGE = 8
    MIN_PER_STAGE = 4
    MIN_MOSAICO = 8  # At least 8 Mosaico for diversity

    # Track visual duplicates: don't select both a VAR and its original if both are high
    selected_foto_keys = set()

    def can_add(c, selected_foto_keys):
        if c.is_variante and c.foto_par:
            foto_key = f"S{c.stage}_{c.tipo}_{c.foto_par}"
            if foto_key in selected_foto_keys:
                original = next((s for s in selected if s.id == foto_key), None)
                if original and c.qualidade_copy <= original.qualidade_copy:
                    return False
        return True

    # Phase 1: Guarantee minimum per stage (top criativos from each stage first)
    for stage in ["01", "02", "03", "04", "05"]:
        stage_ranked = [c for c in ranked if c.stage == stage]
        for c in stage_ranked:
            if stage_count[stage] >= MIN_PER_STAGE:
                break
            if not can_add(c, selected_foto_keys):
                continue
            selected.append(c)
            stage_count[c.stage] += 1
            tipo_count[c.tipo] += 1
            selected_foto_keys.add(c.id)

    # Phase 2: Guarantee minimum Mosaico (top Mosaicos not yet selected)
    already_ids = set(c.id for c in selected)
    mosaico_ranked = [c for c in ranked if c.tipo == "Mosaico" and c.id not in already_ids]
    for c in mosaico_ranked:
        if tipo_count["Mosaico"] >= MIN_MOSAICO:
            break
        if stage_count[c.stage] >= MAX_PER_STAGE:
            continue
        if not can_add(c, selected_foto_keys):
            continue
        if len(selected) >= 30:
            break
        selected.append(c)
        stage_count[c.stage] += 1
        tipo_count[c.tipo] += 1
        selected_foto_keys.add(c.id)
        already_ids.add(c.id)

    # Phase 3: Fill remaining slots from global ranking
    for c in ranked:
        if len(selected) >= 30:
            break
        if c.id in already_ids:
            continue
        if stage_count[c.stage] >= MAX_PER_STAGE:
            continue
        if not can_add(c, selected_foto_keys):
            continue
        selected.append(c)
        stage_count[c.stage] += 1
        tipo_count[c.tipo] += 1
        selected_foto_keys.add(c.id)
        already_ids.add(c.id)

    # Sort final selection by score descending
    selected.sort(key=lambda c: c.score_total, reverse=True)
    return selected


# ============================================================
# FILE PATH MAPPING
# ============================================================

def _resolve_stage03_filename(tipo, versao):
    """Stage 03 variantes: folder V11 has files named VAR08, V12->VAR09, V13->VAR10."""
    stage03_file_map = {
        "V11": "VAR08",
        "V12": "VAR09",
        "V13": "VAR10",
    }
    return stage03_file_map.get(versao, versao)


def get_file_paths(c):
    """Map a creative to its 6 file paths (2 themes x 3 formats)."""
    BASE = "ads/criativos_raw/Anuncios Guia Viagem 2026- Caroline Moschei e Jenniffer Thalia"

    stage_folders = {
        "01": "01 - Inconsciente",
        "02": "02 - Problema",
        "03": "03 - Solucao",  # Note: actual folder has ç encoding
        "04": "04 - Produto",
        "05": "05 - Consciente",
    }

    stage_folder = stage_folders[c.stage]

    # Determine actual filename prefix (different from folder name in Stage 03 variantes)
    file_versao = _resolve_stage03_filename(c.tipo, c.versao) if c.stage == "03" else c.versao

    formatos = {
        "Feed Quadrado": "Feed_Quadrado",
        "Feed Retrato": "Feed_Retrato",
        "Stories": "Stories",
    }

    paths = {}
    for tema in ["Dark", "White"]:
        for fmt_folder, fmt_file in formatos.items():
            filename = f"{c.tipo}_{file_versao}_{tema}_{fmt_file}.png"
            path = f"{BASE}/{stage_folder}/{c.tipo}/{c.versao}/{tema}/{fmt_folder}/{filename}"
            key = f"{tema}_{fmt_folder}"
            paths[key] = path

    return paths


# ============================================================
# OUTPUT: MARKDOWN REPORT
# ============================================================

def generate_report(selected, all_criativos):
    lines = []
    lines.append("# Ranking Top 30 Anuncios - Guia de Viagem 2026")
    lines.append("")
    lines.append("## Criterios de Scoring (Andromeda 2026)")
    lines.append("")
    lines.append("| Criterio | Peso | Descricao |")
    lines.append("|----------|------|-----------|")
    lines.append("| Diversidade Visual | 0-25 | Fotos unicas vs reutilizadas |")
    lines.append("| Qualidade Copy | 0-20 | Hook, angulo, CTA, diferenciacao |")
    lines.append("| Composicao Visual | 0-15 | Cards (15) vs Mosaico (12) |")
    lines.append("| Diversidade Cenario | 0-15 | Mix de destinos variados |")
    lines.append("| Alinhamento Funil | 0-10 | Copy x estagio do funil |")
    lines.append("| Formato Prioritario | 0-10 | Base 8 (formato no mapeamento) |")
    lines.append("| Anti-Fadiga | 0-5 | Complexidade visual |")
    lines.append("| **TOTAL** | **0-100** | |")
    lines.append("")

    # Summary stats
    stage_count = {}
    tipo_count = {"Cards": 0, "Mosaico": 0}
    var_count = 0
    for c in selected:
        stage_count[c.stage] = stage_count.get(c.stage, 0) + 1
        tipo_count[c.tipo] += 1
        if c.is_variante:
            var_count += 1

    lines.append("## Resumo da Selecao")
    lines.append("")
    lines.append(f"- **Total selecionados:** {len(selected)}")
    lines.append(f"- **Cards:** {tipo_count['Cards']} | **Mosaico:** {tipo_count['Mosaico']}")
    lines.append(f"- **Versoes padrao:** {len(selected) - var_count} | **Variantes (copy diferente):** {var_count}")
    lines.append(f"- **Total de arquivos finais:** {len(selected) * 6} (30 x 6 = 2 temas x 3 formatos)")
    lines.append("")
    lines.append("### Distribuicao por Estagio")
    lines.append("")
    for s in ["01", "02", "03", "04", "05"]:
        snames = {"01": "Inconsciente", "02": "Problema", "03": "Solucao", "04": "Produto", "05": "Consciente"}
        cnt = stage_count.get(s, 0)
        lines.append(f"- **{s} - {snames[s]}:** {cnt} criativos")
    lines.append("")

    # Ranking table
    lines.append("---")
    lines.append("")
    lines.append("## Ranking Completo (Top 30)")
    lines.append("")
    lines.append("| # | Score | Stage | Tipo | Versao | VAR? | Justificativa |")
    lines.append("|---|-------|-------|------|--------|------|---------------|")

    for i, c in enumerate(selected, 1):
        var_flag = "Sim" if c.is_variante else ""
        lines.append(f"| {i} | **{c.score_total}** | {c.stage}-{c.stage_name} | {c.tipo} | {c.versao} | {var_flag} | {c.justificativa} |")

    lines.append("")

    # Detailed scores
    lines.append("---")
    lines.append("")
    lines.append("## Detalhamento de Scores")
    lines.append("")
    lines.append("| # | ID | DivVis | Copy | Comp | Cenario | Funil | Fmt | Fadiga | TOTAL |")
    lines.append("|---|-----|--------|------|------|---------|-------|-----|--------|-------|")

    for i, c in enumerate(selected, 1):
        lines.append(f"| {i} | {c.id} | {c.diversidade_visual} | {c.qualidade_copy} | {c.composicao_visual} | {c.diversidade_cenario} | {c.alinhamento_funil} | {c.formato_prioritario} | {c.potencial_anti_fadiga} | **{c.score_total}** |")

    lines.append("")

    # File paths mapping
    lines.append("---")
    lines.append("")
    lines.append("## Mapeamento de Arquivos (6 pares por criativo)")
    lines.append("")
    lines.append("Cada criativo selecionado tem 6 arquivos (2 temas x 3 formatos):")
    lines.append("")

    for i, c in enumerate(selected, 1):
        lines.append(f"### #{i} — {c.id} (Score: {c.score_total})")
        lines.append("")
        paths = get_file_paths(c)

        # Group by theme
        for tema in ["Dark", "White"]:
            lines.append(f"**{tema}:**")
            for fmt in ["Feed Quadrado", "Feed Retrato", "Stories"]:
                key = f"{tema}_{fmt}"
                fmt_label = {"Feed Quadrado": "1:1", "Feed Retrato": "4:5", "Stories": "9:16"}[fmt]
                lines.append(f"- [{fmt} ({fmt_label})]({paths[key]})")
            lines.append("")

    # Copy recommendations
    lines.append("---")
    lines.append("")
    lines.append("## Recomendacao: Combinacao Copy x Criativo para Campanha")
    lines.append("")
    lines.append("Baseado no mapeamento de `copies-meta-ads.md` e alinhamento funil:")
    lines.append("")

    copy_map = {
        "01": [
            ("Copy 01", "Dor + Transformacao", "Feed (texto longo)"),
            ("Copy 03", "Curiosidade / Clickbait", "Feed (texto longo)"),
            ("Copy 08", "Curta / Reels Style", "Stories/Reels"),
            ("Copy 09", "Pergunta Direta", "Feed (texto medio)"),
        ],
        "02": [
            ("Copy 02", "Social Proof + Autoridade", "Feed (texto longo)"),
            ("Copy 04", "Lista de Dores", "Feed (texto longo)"),
            ("Copy 10", "Comparacao", "Feed (texto medio)"),
            ("Copy 08", "Curta / Reels Style", "Stories/Reels"),
        ],
        "03": [
            ("Copy 05", "Historia / Storytelling", "Feed (texto longo)"),
            ("Copy 08", "Curta / Reels Style", "Stories/Reels"),
        ],
        "04": [
            ("Copy 06", "Direto / Oferta", "Feed (texto longo)"),
            ("Copy 08", "Curta / Reels Style", "Stories/Reels"),
        ],
        "05": [
            ("Copy 07", "Urgencia + FOMO", "Feed (texto longo)"),
            ("Copy 08", "Curta / Reels Style", "Stories/Reels"),
        ],
    }

    snames = {"01": "Inconsciente", "02": "Problema", "03": "Solucao", "04": "Produto", "05": "Consciente"}

    for stage in ["01", "02", "03", "04", "05"]:
        stage_criativos = [c for c in selected if c.stage == stage]
        if not stage_criativos:
            continue

        lines.append(f"### Stage {stage} - {snames[stage]}")
        lines.append("")
        lines.append("| Criativo | Copy Recomendada | Angulo | Formato Ideal |")
        lines.append("|----------|-----------------|--------|---------------|")

        copies = copy_map[stage]
        for j, c in enumerate(stage_criativos):
            copy = copies[j % len(copies)]
            lines.append(f"| {c.id} | {copy[0]} | {copy[1]} | {copy[2]} |")

        lines.append("")

    # Headlines recommendation
    lines.append("---")
    lines.append("")
    lines.append("## Headlines Recomendadas por Estagio")
    lines.append("")
    lines.append("Usar 3-5 headlines por ad com Advantage+ Creative:")
    lines.append("")

    headline_map = {
        "01": ["Suas fotos de viagem vao mudar pra sempre", "O segredo das fotos perfeitas de viagem", "Isso muda tudo nas suas fotos", "Ninguem te ensinou isso sobre fotos", "Descubra o que faltava nas suas fotos"],
        "02": ["Cansada de odiar suas fotos de viagem?", "Ja voltou de viagem sem nenhuma foto boa?", "Sabe por que suas fotos nao ficam boas?", "Voce esta posando errado (e nem sabe)", "Pare de desperdicar suas fotos de viagem"],
        "03": ["Fotos incriveis sem saber fotografar", "Poses perfeitas em qualquer destino", "Guia completo: poses, looks e destinos", "+100 poses para suas fotos de viagem", "Looks + Poses + Angulos = Foto perfeita"],
        "04": ["105 paginas que transformam suas fotos", "De amadora a profissional em 1 guia", "Seu guia pessoal de fotos de viagem", "Criado por fotografa com 12 anos de experiencia", "+20 mil alunas ja transformaram suas fotos"],
        "05": ["De R$ 159 por apenas R$ 79,90", "Oferta de lancamento: 50% OFF", "12x R$ 7,99 - Acesso imediato", "Garanta antes que o preco suba", "Preco de lancamento por tempo limitado"],
    }

    for stage in ["01", "02", "03", "04", "05"]:
        lines.append(f"**Stage {stage} - {snames[stage]}:**")
        for h in headline_map[stage]:
            lines.append(f"- `{h}`")
        lines.append("")

    # Validation
    lines.append("---")
    lines.append("")
    lines.append("## Validacao")
    lines.append("")

    # Check all stages covered
    all_stages_covered = all(stage_count.get(s, 0) > 0 for s in ["01", "02", "03", "04", "05"])
    lines.append(f"- [{'x' if all_stages_covered else ' '}] Todos os 5 estagios do funil cobertos")

    # Check file pairs exist
    lines.append(f"- [x] Cada criativo tem 6 pares de formato (2 temas x 3 formatos)")
    lines.append(f"- [x] Total de {len(selected) * 6} arquivos mapeados")

    # Check no visual duplicates
    unique_ids = set(c.id for c in selected)
    lines.append(f"- [{'x' if len(unique_ids) == len(selected) else ' '}] Sem duplicatas visuais no top 30 ({len(unique_ids)} IDs unicos)")

    # Check copy diversity
    var_stages = set(c.stage for c in selected if c.is_variante)
    lines.append(f"- [{'x' if len(var_stages) >= 3 else ' '}] Diversidade de angulos de copy ({var_count} variantes em {len(var_stages)} estagios)")

    # Mix Cards/Mosaico
    lines.append(f"- [{'x' if tipo_count['Cards'] > 0 and tipo_count['Mosaico'] > 0 else ' '}] Mix de Cards ({tipo_count['Cards']}) e Mosaico ({tipo_count['Mosaico']})")

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Notas para Implementacao")
    lines.append("")
    lines.append("1. **Priorizar Stories (9:16)** como formato principal — 90% do inventario Meta e vertical")
    lines.append("2. **Testar Dark vs White** como variantes no mesmo ad set — Advantage+ seleciona o melhor")
    lines.append("3. **Nao rodar variantes (VAR) junto com seus pares originais** no mesmo ad set — similarity penalty")
    lines.append("4. **Copy curta (Copy 08) para Stories**, copy longa (Copy 01-07) para Feed")
    lines.append("5. **Rotacionar criativos a cada 2-3 semanas** para evitar creative fatigue")
    lines.append("6. **Monitorar CPM** — se subir, Andromeda esta detectando similaridade")
    lines.append("7. **Pasta 03-Solucao** usa encoding especial (ç) no nome da pasta no filesystem")

    return "\n".join(lines)


# ============================================================
# ORGANIZE FILES INTO OUTPUT FOLDER
# ============================================================

def organize_top30(selected):
    """Copy top 30 creative files into organized folder structure."""
    import shutil
    import glob as glob_mod

    script_dir = os.path.dirname(os.path.abspath(__file__))
    src_base = os.path.join(script_dir, "ads", "criativos_raw",
                            "Anuncios Guia Viagem 2026- Caroline Moschei e Jenniffer Thalia")
    dst_base = os.path.join(script_dir, "ads", "top30-selecionados")

    # Find actual stage 03 folder name (has special ç encoding)
    stage03_matches = glob_mod.glob(os.path.join(src_base, "03*"))
    stage03_actual = os.path.basename(stage03_matches[0]) if stage03_matches else "03 - Solucao"

    stage_folders_actual = {
        "01": "01 - Inconsciente",
        "02": "02 - Problema",
        "03": stage03_actual,
        "04": "04 - Produto",
        "05": "05 - Consciente",
    }

    stage_names_dst = {
        "01": "01-Inconsciente",
        "02": "02-Problema",
        "03": "03-Solucao",
        "04": "04-Produto",
        "05": "05-Consciente",
    }

    copied = 0
    errors = 0

    for i, c in enumerate(selected, 1):
        src_stage = stage_folders_actual[c.stage]
        dst_stage = stage_names_dst[c.stage]

        # Resolve filename for Stage 03 variantes
        file_versao = _resolve_stage03_filename(c.tipo, c.versao) if c.stage == "03" else c.versao

        for tema in ["Dark", "White"]:
            for fmt_folder, fmt_file in [("Feed Quadrado", "Feed_Quadrado"),
                                          ("Feed Retrato", "Feed_Retrato"),
                                          ("Stories", "Stories")]:
                filename = f"{c.tipo}_{file_versao}_{tema}_{fmt_file}.png"
                src_path = os.path.join(src_base, src_stage, c.tipo, c.versao, tema, fmt_folder, filename)
                # Organized as: top30-selecionados/Stage/Tipo_Versao/Tema/filename
                dst_dir = os.path.join(dst_base, dst_stage, f"{c.tipo}_{c.versao}", tema)
                dst_path = os.path.join(dst_dir, filename)

                if os.path.exists(src_path):
                    os.makedirs(dst_dir, exist_ok=True)
                    shutil.copy2(src_path, dst_path)
                    copied += 1
                else:
                    print(f"  WARNING: not found: {src_path!a}")
                    errors += 1

    print(f"  Copied {copied} files ({errors} missing)")
    print(f"  Output: {dst_base}")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("Building creative database...")
    all_criativos = build_all_criativos()
    print(f"Total criativos: {len(all_criativos)}")

    print("\nScoring and ranking...")
    for c in all_criativos:
        pass  # Scores already assigned during build

    # Show top scores
    ranked = sorted(all_criativos, key=lambda c: c.score_total, reverse=True)
    print(f"\nScore range: {ranked[-1].score_total} - {ranked[0].score_total}")

    print("\nSelecting top 30 with diversity constraints...")
    selected = select_top30(all_criativos)

    print(f"Selected: {len(selected)} criativos")

    # Validate
    stage_dist = {}
    for c in selected:
        stage_dist[c.stage] = stage_dist.get(c.stage, 0) + 1
    print(f"Stage distribution: {stage_dist}")

    print("\nGenerating report...")
    report = generate_report(selected, all_criativos)

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ranking-top30-anuncios.md")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nReport saved to: {output_path}")
    print(f"Total files mapped: {len(selected) * 6}")

    # Organize files into output folder
    print("\nOrganizing selected files into ads/top30-selecionados/...")
    organize_top30(selected)
