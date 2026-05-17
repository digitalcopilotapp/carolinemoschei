# Audit 06 — FASE 7: Audit Final Playwright

**Data:** 2026-05-15
**Worker:** t_b1c1d8c0 (run 4)
**Páginas auditadas:** pages/funil/index.html, pages/guia-de-poses.html

---

## Resultados por Viewport

### Funil Principal (pages/funil/index.html)

| Viewport | Status | Imagens | Seções |
|----------|--------|---------|--------|
| Mobile 390×844 | ✅ OK | 14/14 ok (lazy OK) | 10/10 |
| Desktop 1440×900 | ✅ OK | 14/14 ok | 10/10 |

**Seções verificadas:**
- ✅ funil-nav (sticky, altura 61px)
- ✅ funil-hero (VSL placeholder + CTA)
- ✅ funil-bio (foto Caroline + stats 4 colunas)
- ✅ funil-para-quem (3 cards de dor)
- ✅ funil-pilares (4 pilares)
- ✅ funil-modulos (20 módulos accordion)
- ✅ funil-depoimentos (6 screenshots + 3 cards + 3 fotos alunos)
- ✅ funil-oferta (price box + CTA checkout)
- ✅ funil-garantia
- ✅ funil-faq (6 perguntas accordion)
- ✅ funil-cta-final

**CTAs:**
- "Quero me inscrever" → #oferta ✅
- "Quero acesso a todos os módulos" → #oferta ✅
- "Garantir minha vaga agora" (×2) → https://pay.hotmart.com/E64464708W ✅

**Accordions:** 26 itens (20 módulos + 6 FAQ) ✅

**Console errors:** 1 (FB Pixel bloqueado em localhost — esperado, ok em produção)

**Layout hero desktop:** 2 colunas (578px / 578px) ✅
**Layout hero mobile:** 1 coluna ✅

### Guia de Poses Hub (pages/guia-de-poses.html)

| Viewport | Status |
|----------|--------|
| Mobile 390×844 | ✅ OK |

**Elementos verificados:**
- ✅ Hero com link para combo
- ✅ 4 cards de guia (corporativo, gestantes, pessoal & criativo, iluminação)
- ✅ Combo banner com CTA

---

## Screenshots Gerados

- `docs/audit/screenshots/funil-mobile-390-hero.jpg`
- `docs/audit/screenshots/funil-mobile-390-full.jpg`
- `docs/audit/screenshots/funil-mobile-390-final.jpg`
- `docs/audit/screenshots/funil-desktop-1440-hero.jpg`
- `docs/audit/screenshots/funil-desktop-1440-full.jpg`
- `docs/audit/screenshots/funil-desktop-1440-final.jpg`
- `docs/audit/screenshots/guia-poses-mobile-390-full.jpg`

---

## Pendências para próximo ciclo

- [ ] Substituir `VIDEO_ID_PLACEHOLDER` na iframe do VSL com o ID real do YouTube (Nathan fornece)
- [ ] Deploy via VPS Hetzner/Hostinger após aprovação do Nathan
- [ ] Rodar Lighthouse mobile real (precisa de deploy público para pontuar)
- [ ] FASE 4 complementar: exportar posts/pages como HTML se necessário
