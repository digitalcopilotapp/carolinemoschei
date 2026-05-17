# Caroline Moschei — Layout Learnings Registry

**Status:** Registro vivo de decisões de layout aprovadas/reprovadas pelo board e Caroline Reviewer.
**Iniciado:** 2026-05-17 por diretiva do board em RAM-86 ("mapeie todo aprendizado").
**Mantido por:** Web Engineer (urlKey `web-engineer`).
**Validado por:** Caroline Reviewer (urlKey `caroline-reviewer`) — exige entrada aqui antes de aprovar qualquer página.

---

## Como usar este arquivo

**Antes de codar uma página:** leia este arquivo inteiro. Procure por padrões similares já registrados. Reuse decisões aprovadas, evite padrões reprovados.

**Depois de cada página entregue:** adicione uma entrada nova no formato abaixo. Sem entrada, a página não é considerada done.

---

## Princípios canônicos da marca (não mexer sem aprovação do board)

### Identidade visual
- **Paleta:** Dark + Gold + Monik (fotografia)
- **Branding:** funil-redesign-2026 (branch task)
- **Migração:** WordPress legacy → assets/wp-media/ (1238 imagens)

### Breakpoints canônicos (sempre testar nestes 3)
- **Mobile:** 390x844
- **Tablet:** 768x1024
- **Desktop:** 1440x900

### Credenciais
- WP admin: nathan@digitalcopilot.app
- SSH Hostinger: /home/hermes/.ssh/daylangaro_deploy

---

## Padrões aprovados (reuse à vontade)

### Páginas estáticas substituindo WP (RAM-54, aprovado 2026-05-16)
- URLs definitivas substituem WP via .htaccess rewrites
- 11 slugs `-novo` aprovadas pelo board

---

## Padrões reprovados (não repetir)

### Deploy estático sem rollback plan (RAM-46, 2026-05-16)
- **O que foi feito:** deploy de páginas estáticas sobre WordPress causou 404s em rotas legadas
- **Solução aplicada:** rollback emergencial + plan estruturado com -novo slugs

---

## Entries por página

---

## 2026-05-17 — wsp-2026-v4 (/wsp-2026)

**Status:** iterating — correção de overflow em review
**Reviewer:** Caroline Reviewer — comment `9f0428c4`
**Branch/commit:** em progresso, RAM-56

### Decisões de layout
- Mobile (390x844): stack vertical, hero-full com vídeo de fundo, event-banner centralizado, CTAs em coluna completa. hero-upper em column (audio + marquee empilhados).
- Tablet (768x1024): hero-inner grid 2 colunas, hero-floating-card aparece ao lado. Panel-cards em static, width 100%.
- Desktop (1440x900): hero hero-inner com floating-card à direita do conteúdo principal. Panel-cards sticky com grid 2 colunas (media + texto). Nav horizontal completa visível.

### Padrões que funcionaram
- `hero-full` com `overflow: hidden` contém a animação do marquee visualmente.
- `data-site-header` + `site-interactions.js` injeta nav padrão automaticamente.
- Panel-cards com sticky scroll no desktop criam efeito cinematic de stacking.
- Video hero com `poster` como fallback garante conteúdo visível mesmo sem autoplay.

### Padrões que reprovaram (e por quê)
- `grid-template-columns: minmax(0, clamp(360px, 45vw, 520px)) minmax(0, 1fr)` no `.panel-card` sem override mobile causava overflow horizontal em 390px. **Fix:** adicionar `grid-template-columns: 1fr` ao bloco `@media (max-width: 1023px)` em `site-theme.css`.

### Referências usadas
- Prime-style event page (hero com vídeo + floating card lateral)
- Caroline Moschei workshop 2023/2024 como referência de produto

### Decisões para reusar
- `.panel-card` no mobile SEMPRE precisa de `grid-template-columns: 1fr` — senão o `clamp(360px…)` da coluna média estoura em 390px.
- `hero-marquee` precisa de `overflow: hidden` no container E no pai para não criar horizontal scroll.

---

## 2026-05-17 — verso-e-reverso-v4 (/verso-reverso)

**Status:** iterating — header padrão adicionado em review
**Reviewer:** Caroline Reviewer — comment `9f0428c4`
**Branch/commit:** em progresso, RAM-56

### Decisões de layout
- Mobile (390x844): custom vr-header-prime com hero video full-screen, overlay content com título "Verso & Reverso" + badge CAROLINE MOSCHEI ACADEMY. Standard nav adicionado no topo via site-interactions.js.
- Tablet (768x1024): hero prime video cobre viewport, nav-bar transparente sticky no topo com standard header acima.
- Desktop (1440x900): hero prime style Netflix/Prime Video — vídeo full-width, content panel à esquerda no overlay. Standard nav no topo antes do hero.

### Padrões que funcionaram
- Página de curso com design inspirado em Prime Video/Netflix. Funciona bem para produto premium.
- Adicionar site-theme.css APÓS styles.css e verso-reverso.css garante que os estilos específicos da página prevalecem sobre os globais.
- `<div data-site-header></div>` + `site-interactions.js` como primeira coisa no body injeta a nav padrão sem quebrar o layout existente.

### Padrões que reprovaram (e por quê)
- **Exceção documentada:** página mantém seu próprio header customizado (vr-header-prime) além do padrão, porque é uma landing de vendas com hero video imersivo. O header padrão foi adicionado acima do hero para satisfazer critério de aceite "todas as páginas com header+footer padrão".
- Usar apenas `/styles.css` + `/verso-reverso.css` sem incluir site-theme.css deixava a página sem a nav padrão Caroline Moschei.

### Referências usadas
- Prime Video / Netflix landing page style para cursos online
- Layout de curso com hero video full-screen + content overlay

### Decisões para reusar
- Landing pages de cursos com hero video imersivo podem ter header duplo (standard nav no topo + custom hero nav abaixo) — o standard nav não quebra o design.
- Para páginas legacy com seus próprios CSS, adicionar site-theme.css por ÚLTIMO evita conflitos (os estilos específicos da página prevalecem).

---

## 2026-05-17 — presets-v4 (/presets)

**Status:** iterating — imagens corrigidas em review
**Reviewer:** Caroline Reviewer — comment `9f0428c4`
**Branch/commit:** em progresso, RAM-56

### Decisões de layout
- Mobile (390x844): hero glass card, eyebrow + heading + description + pills. Card-grid em coluna única. Before/after com drag interativo.
- Tablet (768x1024): card-grid 2 colunas.
- Desktop (1440x900): hero glass card centrado, card-grid 3 colunas, before/after comparison sliders.

### Padrões que funcionaram
- `hero-glass` card no hero cria profundidade sem overload visual.
- `before-after` slider interativo com pointer events — elegante e funcional.
- `data-site-header` + site-theme.css = nav padrão automática em todos os viewports.

### Padrões que reprovaram (e por quê)
- 6 imagens referenciando `carolinemoschei.com/wp-content/...` → ERR_CERT_DATE_INVALID. O certificado SSL do domínio `.com` está expirado. **Fix:** trocar todos os `src` de imagem para `carolinemoschei.site`. **Regra:** NUNCA referenciar imagens de `carolinemoschei.com` — usar sempre `carolinemoschei.site`.

### Referências usadas
- Presets de fotografia estilo editorial (Lightroom marketplace UX)

### Decisões para reusar
- **Regra crítica:** todas as imagens devem usar `carolinemoschei.site` (não `.com`). O domínio `.com` tem SSL expirado.
- Before/after slider precisa de `overflow: hidden` no container para não vazar em mobile.

---

## 2026-05-17 — guia-iluminacao-v4 (/guia-iluminacao)

**Status:** iterating — imagens corrigidas em review
**Reviewer:** Caroline Reviewer — comment `9f0428c4`
**Branch/commit:** em progresso, RAM-56

### Decisões de layout
- Mobile (390x844): hero ebook com mockup do guia à direita, heading à esquerda em stack vertical.
- Tablet (768x1024): hero grid 2 colunas (copy + ebook mockup).
- Desktop (1440x900): hero com ebook mockup visível à direita, gallery-grid de fotos com efeito parallax.

### Padrões que funcionaram
- Hero ebook com imagem do produto à direita cria anticipação do produto.
- Gallery grid com `perspective` no desktop cria efeito 3D visual.
- Panel-cards sticky com seções de conteúdo.

### Padrões que reprovaram (e por quê)
- 11 imagens referenciando `carolinemoschei.com/wp-content/...` → ERR_CERT_DATE_INVALID. **Fix:** trocar para `carolinemoschei.site`. Mesma regra que presets-v4.

### Referências usadas
- E-book / guia visual estilo editorial com gallery de fotos exemplos

### Decisões para reusar
- Hero com mockup do produto à direita (ebook cover) é padrão aprovado para guias digitais.
- **Regra:** auditar TODOS os `src` de imagem em cada página nova contra `carolinemoschei.com` antes de entregar.

---

## 2026-05-17 — guia-v4 (/guia-de-poses — página de catálogo)

**Status:** aprovado visualmente (nav confirmada em desktop 1440px)
**Reviewer:** Caroline Reviewer — comment `9f0428c4` (sem reprovação específica desta página)
**Branch/commit:** em progresso, RAM-56

### Decisões de layout
- Mobile (390x844): hero simples com heading + CTA, product-grid em coluna única.
- Tablet (768x1024): product-grid 2 colunas.
- Desktop (1440x900): product-grid auto-fill com minmax(320px, 1fr), nav horizontal completa.

### Padrões que funcionaram
- `repeat(auto-fill, minmax(320px, 1fr))` no product-grid adapta automaticamente o número de colunas.
- Inline `<style>` no `<head>` para estilos de página específica (sem criar arquivo CSS separado) quando o componente é simples.

### Padrões que reprovaram (e por quê)
- Reviewer apontou hamburger no desktop, mas inspeção confirma que a nav horizontal aparece corretamente em 1440px. A causa provável foi cache ou estado temporário durante a revisão. O breakpoint em `@media (max-width: 1024px)` esconde o hamburger em 1440px corretamente.

### Referências usadas
- Catálogo de produtos inline (guia de todos os infoprodutos)

### Decisões para reusar
- Nav horizontal é exibida automaticamente em > 1024px com o componente site-theme.css padrão. Não precisa de override por página.

---

## 2026-05-17 — links-v4 (/links)

**Status:** exceção intencional — sem header/footer padrão (link-in-bio page)
**Reviewer:** Caroline Reviewer — aprovada como exceção
**Branch/commit:** em progresso, RAM-56

### Decisões de layout
- Mobile-first (390px): design link-in-bio com profile card, grid de links, social icons.
- Sem header/footer padrão: link-in-bio é ponto de entrada autônomo, não faz parte da navegação do site principal.

### Padrões que funcionaram
- CSS isolado em `/styles/link-bio.css` evita conflito com site-theme.css.
- Profile card com avatar, nome e bio acima dos links.

### Exceção documentada
- `/links-v4` não tem header+footer padrão por design intencional: é uma página link-in-bio que serve como hub mobile de entrada. Comportamento aprovado pelo executor e aceito como exceção na primeira revisão.

---

## 2026-05-17 — Sistema de headers v4 (componente transversal)

**Status:** padrão estabelecido
**Reviewer:** Caroline Reviewer

### Regra canônica
Todas as páginas v4 (exceto links-v4 e funil-v2) devem ter:
1. `<link rel="stylesheet" href="/styles/site-theme.css">` no `<head>`
2. `<script defer src="/scripts/site-interactions.js"></script>` no `<head>`
3. `<div data-site-header></div>` como primeiro filho do `<body>`

O site-interactions.js injeta a nav `<header class="site-global-header">` automaticamente com o link ativo marcado por pathname.

### Breakpoints da nav
- `> 1024px`: nav horizontal completa (`.site-global-header__nav` visível, `.site-global-header__toggle` oculto)
- `≤ 1024px`: hamburger menu (drawer animado)

### Imagens — regra crítica
- **Sempre usar `carolinemoschei.site`** (nunca `.com`) para todas as imagens
- O domínio `.com` tem certificado SSL expirado — qualquer referência resulta em ERR_CERT_DATE_INVALID

---

## Referência externa
- [AGENTS.md: Web Engineer](/home/hermes/.paperclip/instances/default/companies/c9260169-f1c6-477a-8091-77df46ef4c25/agents/f5828592-267c-4382-b683-ec02edf9b0b0/instructions/AGENTS.md)
- [Memória: Web Engineer rebrand](/home/hermes/.claude/projects/-home-hermes/memory/project_web_engineer_rebrand.md)
