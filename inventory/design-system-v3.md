# Design System v3 — Caroline Moschei (Art.Session)

Gerado em: 2026-05-16  
Fonte: RAM-73 — Redesign Unificado v3

---

## Paleta de Cores

| Token | Hex | CSS var | Uso |
|-------|-----|---------|-----|
| `--color-hero` | `#1e1917` | `--color-hero` | Hero sections, fundos escuros, nav |
| `--color-bg` | `#faf8f5` | `--color-bg` | Fundo principal de páginas |
| `--color-accent` | `#b8967a` | `--color-accent` | CTAs primários, terracota, destaques |
| `--color-text` | `rgba(30,25,23,0.80)` | `--color-text` | Texto corpo (80% opacidade) |
| `--color-text-dark` | `#1e1917` | `--color-text-dark` | Títulos, textos em fundo claro |
| `--color-text-light` | `#faf8f5` | `--color-text-light` | Texto sobre fundo escuro |
| `--color-accent-dark` | `#8a6e5a` | `--color-accent-dark` | Hover state do botão terracota |
| `--color-divider` | `rgba(30,25,23,0.12)` | `--color-divider` | Linhas divisórias suaves |

### Mapeamento das cores v2 → v3 (para transformação Elementor)

| Cor v2 (atual) | Cor v3 | Uso |
|---------------|--------|-----|
| `#7D4E49` (primary rose) | `#b8967a` | Accent/CTA |
| `#F5ECE4` (secondary cream) | `#faf8f5` | Fundo |
| `#8C6562` (text rose) | `rgba(30,25,23,0.80)` | Texto corpo |
| `#B16E67` (accent coral) | `#b8967a` | Accent |
| `#030303`, `#0A0A0A` (dark) | `#1e1917` | Hero/dark |
| `#FFBC7D` (transition) | `#b8967a` | Accent |
| `#80514D` (links) | `#b8967a` | Links/CTAs |
| `#7D4E4954` (opacity) | `rgba(184,150,122,0.33)` | Opacidade accent |

---

## Tipografia

### Fontes

| Papel | Família | Peso | Uso |
|-------|---------|------|-----|
| Títulos | `Times New Roman`, serif | 400 (normal, **sem itálico, sem negrito**) | H1, H2, H3, títulos de seção |
| Corpo | `Outfit`, `-apple-system`, sans-serif | 300–400 | Parágrafos, listas, descrições |
| Caption | `Outfit`, `-apple-system`, sans-serif | 400 | Legendas, labels menores |

### Mapeamento de fontes v2 → v3

| Fonte v2 | Fonte v3 |
|---------|---------|
| `Monik Font`, `Monik` | `Times New Roman`, serif |
| `sweet-sans-pro` | `Outfit`, -apple-system |
| `Sora` | `Outfit`, -apple-system |
| `Inter` | `Outfit`, -apple-system |

### Hierarquia de tamanhos

| Nível | px | rem | Line-height | Letter-spacing |
|-------|----|-----|-------------|----------------|
| H1 | 56px | 3.5rem | 1.1 | -0.02em |
| H2 | 40px | 2.5rem | 1.15 | -0.01em |
| H3 | 28px | 1.75rem | 1.25 | 0 |
| Body | 18px | 1.125rem | 1.65 | 0 |
| Caption | 14px | 0.875rem | 1.5 | 0.02em |

**Mobile (≤768px):**
| H1 | 36px | 2.25rem |
| H2 | 28px | 1.75rem |
| H3 | 22px | 1.375rem |
| Body | 16px | 1rem |

---

## Componentes Recorrentes

### Hero Section
```
Fundo: #1e1917
Padding: 120px top, 80px bottom (desktop) / 80px top, 60px bottom (mobile)
Layout: imagem de fundo (parallax ou cover) + overlay escuro 40% + conteúdo centralizado
Conteúdo:
  - Título: Times New Roman, 56px, #faf8f5, letter-spacing -0.02em
  - Subtítulo: Outfit, 20px, rgba(250,248,245,0.80)
  - CTA primário: botão terracota (#b8967a) → texto #faf8f5, padding 16px 40px, border-radius 2px
  - CTA secundário: contorno branco → text #faf8f5, mesmo padding
```

### Bloco de Bullets (Dúvidas/Entregas)
```
Layout: 2 colunas (desktop) / 1 coluna (mobile)
Título da seção: H2, Times New Roman, #1e1917
Item: ícone terracota + texto Outfit 18px #1e1917 (80% opacidade)
Ícone: check mark ou dash — cor #b8967a
Gap entre itens: 24px vertical
```

### Card de Produto/Combo
```
Fundo: #faf8f5
Border: 1px solid rgba(30,25,23,0.12)
Border-radius: 4px
Padding: 32px
Conteúdo: imagem hero (16:9 ou 3:2) + título H3 + bullets entrega + preço + CTA
Preço: Times New Roman, 36px, #1e1917
CTA: botão terracota #b8967a, full-width
```

### CTA Primário (Terracota)
```
Background: #b8967a
Texto: #faf8f5, Outfit, 16px, font-weight 500, uppercase, letter-spacing 0.08em
Padding: 16px 40px
Border-radius: 2px
Hover: background #8a6e5a, transition 200ms
Width: auto (desktop) / 100% (mobile)
```

### CTA Secundário (Escuro)
```
Background: #1e1917
Texto: #faf8f5, Outfit, 16px, font-weight 500, uppercase
Mesmo padding e border-radius que primário
Hover: background rgba(30,25,23,0.85)
```

### Footer Padronizado
```
Fundo: #1e1917
Texto: rgba(250,248,245,0.60)
Links: rgba(250,248,245,0.80) → hover #b8967a
Conteúdo: logo + links de navegação + © Caroline Moschei + links legais
Padding: 48px vertical (desktop) / 32px (mobile)
```

---

## Grid e Espaçamento

| Propriedade | Desktop | Tablet (768px) | Mobile (390px) |
|-------------|---------|----------------|----------------|
| Container max-width | 1232px | 100% | 100% |
| Padding lateral | 48px | 32px | 20px |
| Gap vertical entre seções | 80–120px | 60px | 48px |
| Gap entre colunas | 40px | 24px | 0 |

### Breakpoints (herdados do Elementor)
- Mobile: até 767px
- Tablet: 768px–1024px
- Desktop: 1025px+

---

## Regras de Implementação no Elementor

### Ao criar páginas v3:
1. Status: **draft** (nunca publish)
2. Slug: `{slug-original}-v3`
3. Template: `elementor_canvas` (sem header/footer WordPress)
4. Não deletar a página original

### Transformação dos elementos:
- Seções/containers `background_color`: substituir conforme mapeamento de cores
- Widgets de heading: substituir `typography_font_family` para Times New Roman
- Widgets de texto/button: substituir `typography_font_family` para Outfit
- Botões: cor de fundo → `#b8967a`, texto → `#faf8f5`
- Ícones: cor → `#b8967a`

---

## Produtos e Preços (para guia-v3)

| Produto | Preço | Hotmart URL | Tipo |
|---------|-------|-------------|------|
| Verso e Reverso 2026 | R$ 1.997 | pay.hotmart.com/E64464708W | Workshop principal |
| Presets Studio | — | pay.hotmart.com/B88275627G | Pack presets |
| Presets Vintage & Urban | — | pay.hotmart.com/H88274617O | Pack presets |
| Presets Travel | — | pay.hotmart.com/N72783134T | Pack presets |
| Presets Externo | — | pay.hotmart.com/Q73385340S | Pack presets |
| Workshop Presencial 2026 | — | pay.hotmart.com/V84544920A | Workshop presencial |
| Guia de Iluminação | — | pay.hotmart.com/D102526427D | Guia digital |
| Combo WS Tratamento | — | pay.hotmart.com/U87081319C | Combo |

---

## Páginas v3 a Criar (Fase 3)

| Página original | ID WordPress | Slug v3 | Prioridade |
|-----------------|-------------|---------|-----------|
| links | 7718 | links-v3 | Alta |
| verso-e-reverso-2025 | 13505 | verso-e-reverso-v3 | Alta |
| presets | 1901 | presets-v3 | Alta |
| guia-iluminacao | 13805 | guia-iluminacao-v3 | Alta |
| guia-fotografia-corporativa | 13648 | guia-fotografia-corporativa-v3 | Alta |
| curso-de-fotografia-de-celular | 8512 | curso-fotografia-celular-v3 | Média |
| ws-tratamento-photoshop | 8070 | ws-photoshop-v3 | Média |
| wsp-2026 | 13015 | wsp-2026-v3 | Média |
| (nova) | — | guia-v3 | Alta |
