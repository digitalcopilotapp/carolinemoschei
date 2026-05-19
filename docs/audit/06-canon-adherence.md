# Audit 06 — Canon Adherence: workshop-presencial-v4.html

**Data:** 2026-05-19
**Worker:** t_b1c1d8c0 (run 6)
**Status:** AGUARDANDO REVISÃO

---

## Objetivo

Reconstruir `pages/workshop-presencial-v4.html` com DNA canon extraído de
`/home/hermes/od-projects/136dcaaf-7a48-4123-97f4-cf95f98699b9/caroline-moschei-home.html`.

PR #31 foi REJEITADO porque a página usava paleta errada (dark #0d0d14 + gold #c6a060 +
Google Fonts Inter/Outfit). Este run corrige o problema raiz.

---

## Canon vs. Página Antes (PR #31 — REJEITADO)

| Token | Canon (OD) | Antes (rejeitado) |
|-------|-----------|-------------------|
| Background | `oklch(0.985 0.008 75)` cream | `#0d0d14` dark |
| Accent | `oklch(0.55 0.12 28)` terracota | `#c6a060` gold |
| Fonte display | Monik (local TTF) | Inter + Outfit (Google CDN) |
| Fonte body | Monik | Inter |
| CSS strategy | Self-contained inline | Externo `site-theme.css` |
| Header | Floating pill glass | Sticky dark bar |

---

## Canon vs. Página Depois (REBUILT)

| Token | Canon (OD) | Depois (rebuilt) | Match |
|-------|-----------|-----------------|-------|
| Background | `oklch(0.985 0.008 75)` | `oklch(0.985 0.008 75)` | ✅ |
| Accent | `oklch(0.55 0.12 28)` | `oklch(0.55 0.12 28)` | ✅ |
| Surface dark | `oklch(0.12 0.01 28)` | `oklch(0.12 0.01 28)` | ✅ |
| Fonte | Monik local TTF | Monik `../assets/fonts/` | ✅ |
| Header | Floating pill + glass | Floating pill + glass | ✅ |
| Marquee | Dark bg + terracota dots | Dark bg + terracota dots | ✅ |
| FAQ | details/summary + SVG chevron | details/summary + SVG chevron | ✅ |
| Footer pill | Fixed bottom glass | Fixed bottom glass | ✅ |
| CSS strategy | Self-contained | Self-contained (no external dep) | ✅ |
| Checkout URL | Hotmart preserved | `pay.hotmart.com/V84544920A?off=f08i4kp5` | ✅ |

---

## Screenshots Canon (OD source-of-truth)

| Viewport | Arquivo |
|----------|---------|
| 390px mobile | `docs/audit/canon-snapshots/canon-home-390.png` |
| 768px tablet | `docs/audit/canon-snapshots/canon-home-768.png` |
| 1440px desktop | `docs/audit/canon-snapshots/canon-home-1440.jpeg` |

## Screenshots Página Reconstruída

| Viewport | Arquivo |
|----------|---------|
| 390px mobile | `docs/audit/canon-snapshots/workshop-v4-390.png` |
| 768px tablet | `docs/audit/canon-snapshots/workshop-v4-768.png` |
| 1440px desktop | `docs/audit/canon-snapshots/workshop-v4-1440.jpeg` |

---

## Observações de Implementação

1. **Imagens placeholder**: seções "Na última edição" (galeria alunos) e depoimentos
   usam placeholders. Caroline precisa fornecer fotos reais do workshop.

2. **VSL YouTube**: usando ID `13_HwkJ1AkY` (placeholder de run anterior). Confirmar
   URL real do vídeo de apresentação do workshop com Caroline.

3. **Cronograma**: timeline marcada como "horários indicativos" — confirmar com Caroline.

4. **Monik @font-face**: path `../assets/fonts/Monik-Regular.ttf` — requer que o
   arquivo exista no deploy. Já confirmado presente no repo.

---

## Estrutura de Seções (workshop-presencial-v4.html)

1. Hero (dark video overlay) + CTA principal
2. Marquee strip (terracota dots — idêntico ao canon)
3. VSL YouTube embed
4. O que você vai aprender (6 cards)
5. Para quem é este workshop? (2 colunas)
6. Na última edição (galeria — placeholder)
7. Cronograma do dia (timeline dark section)
8. Onde acontece (local info)
9. O que dizem os alunos (depoimentos)
10. Caroline Moschei (bio + stats)
11. Reserve já o seu ingresso (pricing grid)
12. Garantia 7 dias
13. Perguntas frequentes (FAQ accordion — idêntico ao canon)
14. Garanta sua vaga (CTA final)
15. Footer pill (floating fixed — idêntico ao canon)
