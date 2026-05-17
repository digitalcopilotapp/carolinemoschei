# Audit 01 — Codebase Design System

**Data:** 2026-05-15
**Worker:** t_b1c1d8c0

---

## Design System Canônico (pages/ + styles/)

### Paleta de Cores

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| --color-bg-body | #060608 | Fundo principal (preto quente) |
| --color-bg-alt | #101014 | Fundo alternativo |
| --color-bg-panel | rgba(18,18,24,0.75) | Painéis glassmorphism |
| --color-surface | #1a1a24 | Superfícies elevated |
| --color-surface-light | #f4ede1 | Superfícies claras |
| --color-ink-primary | #f8f5ef | Texto principal |
| --color-ink-muted | rgba(248,245,239,0.72) | Texto secundário |
| --color-ink-dark | #0b0b0f | Texto sobre fundo claro |
| --color-accent | #d0a16b | Gold/caramel — CTAs, bordas |
| --color-accent-soft | rgba(208,161,107,0.22) | Glow suave do accent |
| --color-border | rgba(255,255,255,0.08) | Bordas sutis |
| --color-border-strong | rgba(255,255,255,0.16) | Bordas mais visíveis |

### Tipografia

| Uso | Família | Pesos | Origem |
|-----|---------|-------|--------|
| Display/Headlines | Monik | 300–800 | Local TTF (/assets/fonts/) |
| Body | Inter, Outfit | 300–700 | Google Fonts |

### Reference WeTransfer Design System

| Token | Hex | CSS var |
|-------|-----|---------|
| Ink | #080808 | --ink |
| Bone | #F0EBE3 | --bone |
| Cream | #FAF4ED | --cream |
| Caramel | #C8956C | --caramel |
| Gold | #D4A574 | --gold |
| Warm Gray | #7A756F | --warm-gray |

**Tipografia Reference:** Cormorant Garamond (serif display) + Inter (body)

### Conclusão

O padrão canônico atual (pages/) usa Monik + dark background + gold accent — mais maduro e com fonte proprietária local. A referência WeTransfer usa Cormorant Garamond — mais sofisticado e editorial. O funil novo vai fundir os dois: usar Cormorant Garamond como display (já carregado no reference e sem licença adicional) + Monik para headings secundários + Inter para corpo.

---

## Páginas Existentes

| Arquivo | Produto | Status |
|---------|---------|--------|
| pages/verso-reverso.html | Verso & Reverso workshop | Ativo, Xmas banner |
| pages/guia-iluminacao.html | Guia Iluminação | Ativo |
| pages/guia-fotografia-corporativa.html | Guia Corporativo | Ativo |
| pages/presets.html | Presets Lightroom | Ativo |
| pages/curso-de-fotografia-de-celular.html | Curso celular | Ativo |
| pages/curso-photoshop.html | Curso Photoshop | Ativo |
| pages/links.html | Link-in-bio | Ativo |
| pages/orcamentos.html | Orçamentos | Ativo |
| pages/wsp-2026.html | WhatsApp CTA | Ativo |

## Assets Disponíveis

- 125 imagens/SVGs em /assets/
- Fotos WebP por categoria em /reference/fotos-optimized/ (33 fotos)
- Fotos de portfólio em /reference/site/portfolio/ (~80 fotos)
- Fotos de ensaio em /reference/site/photos/ (40 fotos)
- Ícones Verso & Reverso SVG em /assets/icons/ (20+ ícones)
- Banners link-na-bio em /assets/images/link-bio/
