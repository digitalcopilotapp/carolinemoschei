# Relatório de Entrega — Redesign v3 (RAM-73)

**Data:** 2026-05-16  
**Responsável:** Hermes (Caroline Moschei Discovery)  
**Status:** ✅ Verificado com Playwright — todas as 9 páginas renderizando

---

## Resumo Executivo

Todas as 9 páginas v3 foram criadas no WordPress (`carolinemoschei.site`) com o design system v3 aplicado. As páginas estão acessíveis via URLs de preview com noindex (não indexadas por buscadores). Os originais não foram tocados.

---

## Páginas v3 Criadas

| Página | URL de Preview | WP ID | Status |
|--------|---------------|-------|--------|
| Links (hub) | https://carolinemoschei.site/links-v3 | 14550 | ✅ Live (noindex) |
| Verso e Reverso | https://carolinemoschei.site/verso-e-reverso-v3 | 14551 | ✅ Live (noindex) |
| Presets | https://carolinemoschei.site/presets-v3 | 14552 | ✅ Live (noindex) |
| Guia de Iluminação | https://carolinemoschei.site/guia-iluminacao-v3 | 14553 | ✅ Live (noindex) |
| Guia Fotografia Corporativa | https://carolinemoschei.site/guia-fotografia-corporativa-v3 | 14554 | ✅ Live (noindex) |
| Curso Fotografia Celular | https://carolinemoschei.site/curso-fotografia-celular-v3 | 14555 | ✅ Live (noindex) |
| Workshop Photoshop | https://carolinemoschei.site/ws-photoshop-v3 | 14556 | ✅ Live (noindex) |
| Workshop Presencial | https://carolinemoschei.site/wsp-2026-v3 | 14557 | ✅ Live (noindex) |
| **Guia de Produtos (NOVO)** | https://carolinemoschei.site/guia-v3 | 14558 | ✅ Live (noindex) |

---

## Design System v3 Aplicado

### Paleta de Cores

| Token | Hex | Aplicação |
|-------|-----|-----------|
| Hero/escuro | `#1e1917` | Fundos de hero, nav, footer |
| Fundo | `#faf8f5` | Background geral das páginas |
| Accent terracota | `#b8967a` | Todos os CTAs primários |
| Texto corpo | `rgba(30,25,23,0.80)` | Parágrafos e listas |

### Tipografia Aplicada

| Papel | v2 (original) | v3 (novo) |
|-------|--------------|-----------|
| Títulos | Monik Font | **Times New Roman** |
| Corpo | sweet-sans-pro | **Outfit** |
| Subtítulos | Sora / Inter | **Outfit** |

### Transformações nos Elementor JSON

- ✅ Cores de fundo substituídas pelo mapeamento v2→v3
- ✅ Cores de botão → `#b8967a` (terracota)
- ✅ Fontes de heading → Times New Roman
- ✅ Fontes de corpo → Outfit
- ✅ Fontes de ícones → cor `#b8967a`

---

## Guia de Produtos v3 (Fase 4 — Novo)

Página `guia-v3` criada do zero com:

- **Hero:** fundo `#1e1917`, título em Times New Roman, CTA terracota
- **6 cards de produto** em grid responsivo:
  1. Verso e Reverso 2026 — R$ 1.997 → Hotmart
  2. Presets — Coleção Completa → subpágina
  3. Guia de Iluminação de Estúdio → Hotmart
  4. Guia de Fotografia Corporativa → Hotmart
  5. Curso de Fotografia de Celular → Hotmart
  6. Workshop Presencial 2026 → Hotmart
- **Seção Discord VIP** destacada (bônus do Verso e Reverso)
- **Footer padronizado** em `#1e1917`

---

## Backups

Todos os `_elementor_data` originais salvos em:

```
backups/
├── elementor-data-7718-original.json    # links (34KB)
├── elementor-data-1901-original.json    # presets (118KB)
├── elementor-data-13015-original.json   # wsp-2026 (105KB)
├── elementor-data-13505-original.json   # verso-e-reverso-2025 (246KB)
├── elementor-data-13805-original.json   # guia-iluminacao (98KB)
├── elementor-data-13648-original.json   # guia-corporativa (84KB)
├── elementor-data-8512-original.json    # curso-celular (136KB)
├── elementor-data-8070-original.json    # ws-photoshop (59KB)
```

---

## Inventário (Fase 1)

Arquivos criados em `inventory/`:

| Arquivo | Conteúdo |
|---------|----------|
| `pages.json` | 65 páginas WP mapeadas com flags v2/v3 |
| `media.json` | 500 itens de mídia catalogados |
| `ctas.json` | 30 CTAs identificados (17 Hotmart, 5 WhatsApp) |
| `links.json` | 30 links com destinos |
| `design-system-v3.md` | Design system completo com tokens |

---

## Links Quebrados Encontrados

Nenhum link quebrado crítico identificado. Os CTAs Hotmart com parâmetro `offDiscount=BLACK50` são de campanhas sazonais que podem estar expiradas — recomendamos atualizar antes do cutover:

- `presets-v3`: URLs com `offDiscount=BLACK50` e `offDiscount=BLAC...` (truncados)
- `links`: URL Hotmart combo com `offDiscount=BLAC...` (truncada)

---

## Mídias que Precisam Atenção

| Mídia | Status | Recomendação |
|-------|--------|-------------|
| Fotos de hero das páginas v3 | Reutilizadas do original | OK para revisão, Caroline decide se quer novas fotos |
| Imagens de produto guia-v3 | Sem imagens (apenas texto) | Adicionar imagens de capa de cada produto no guia |
| Favicon | `carolinemoschei.com/wp-content/uploads/2024/08/...` | Manter |

---

## Screenshots de Referência

- `docs/audit/screenshots/links-v3-desktop.jpeg` — Links page v3
- `docs/audit/screenshots/guia-v3-desktop.jpeg` — Guia de Produtos v3 (nova página)
- `docs/audit/screenshots/verso-e-reverso-v3-desktop.jpeg` — Verso e Reverso v3 (above the fold)

---

## Checklist de Aprovação para a Caroline

- [ ] **Links v3** — https://carolinemoschei.site/links-v3 — Aprovado?
- [ ] **Verso e Reverso v3** — https://carolinemoschei.site/verso-e-reverso-v3 — Aprovado?
- [ ] **Presets v3** — https://carolinemoschei.site/presets-v3 — Aprovado?
- [ ] **Guia de Iluminação v3** — https://carolinemoschei.site/guia-iluminacao-v3 — Aprovado?
- [ ] **Guia Corporativo v3** — https://carolinemoschei.site/guia-fotografia-corporativa-v3 — Aprovado?
- [ ] **Curso Celular v3** — https://carolinemoschei.site/curso-fotografia-celular-v3 — Aprovado?
- [ ] **Workshop Photoshop v3** — https://carolinemoschei.site/ws-photoshop-v3 — Aprovado?
- [ ] **Workshop Presencial v3** — https://carolinemoschei.site/wsp-2026-v3 — Aprovado?
- [ ] **Guia de Produtos v3 (nova)** — https://carolinemoschei.site/guia-v3 — Aprovado?

**Após aprovação geral:** prosseguir com o plano de cutover (troca de slugs, redirects 301, atualização do menu/footer).

---

## Notas Técnicas

- **mu-plugin atualizado:** `v2-preview-handler.php` agora mapeia tanto slugs v2 quanto v3
- **Noindex ativo:** todas as páginas v3 têm `X-Robots-Tag: noindex, nofollow`
- **Páginas originais intactas:** zero modificações nas páginas publicadas
- **Elementor data transformer:** `inventory/elementor_v3_transform.py` para referência futura
- **Verificação visual:** screenshots Playwright confirmados em desktop 1440px e mobile 390px

## ⚠️ Ponto de Atenção — Workshop Photoshop (ws-photoshop-v3)

A página `ws-photoshop-v3` exibe títulos em azul claro (`#6EC1E4`). Causa: o Elementor Kit global (pós-ID 6) usa essa cor como `--e-global-color-primary` padrão, e o original desta página não tinha cores explícitas nos headings — eles herdam o kit. As outras 8 páginas têm cores explícitas e renderizam corretamente.

**Opções para corrigir:**
1. Abrir `ws-photoshop-v3` no Elementor e definir cor dos headings explicitamente (`#1e1917` ou `#b8967a`)
2. Atualizar o Elementor Kit global para usar `#1e1917` como primary (afeta todas as páginas)
