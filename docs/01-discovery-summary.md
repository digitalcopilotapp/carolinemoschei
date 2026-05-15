# Discovery — carolinemoschei.com

**Data:** 2026-05-15  
**Status:** READ-ONLY — zero deploys realizados  
**Workspace:** /home/hermes/projects/carolinemoschei/

---

## Sumário Executivo

**Caroline Moschei** é fotógrafa profissional com um ecossistema de infoprodutos (workshops, guias digitais, presets, mentoria) e vende via Hotmart. Ela está em processo de **migração do WordPress para um novo site customizado** — o WeTransfer continha o código-fonte do novo site em HTML estático + Node.js, com design system próprio e CLAUDE.md (projeto já trabalhou com IA).

---

## Situação Atual (o que existe hoje)

### Site WordPress — em produção em carolinemoschei.site

| Item | Detalhe |
|------|---------|
| Stack | WordPress 6.9.1 + Hello Elementor + Elementor Pro 3.35.5 |
| Hospedagem | VPS Hostinger (day.digitalcopilot.app), IP 167.88.39.18 |
| URL ativa | http://carolinemoschei.site (o .com está parked) |
| Checkout | Hotmart (pay.hotmart.com/E64464708W) |
| Pixel | Facebook Pixel 1559920731501893 + Conversions API |
| WhatsApp | +55 15 55841024 (JoinChat) |
| Adobe Fonts | Typekit xna2bgz — Monik Font + sweet-sans-pro |
| Backup | BackupBuddy + UpdraftPlus + All-in-One WP Migration |

### Paleta WordPress atual (Elementor Global Kit)

Rose/terracota: `#7D4E49` (primary) · `#F5ECE4` (background) · `#B16E67` (accent) · `#FFBC7D` (transition)

---

## ⚠️ ALERTAS URGENTES

### 1. Domínio carolinemoschei.com está PARKED

O DNS do .com aponta para **above.com** (103.224.212.204 / ns1.abovedomains.com). Quem acessa carolinemoschei.com hoje vê uma página de anúncios genéricos ("carolinemoschei.com may be for sale").

**Pergunta para Nathan:** Isso foi intencional? É parte da migração?

### 2. Suspeita de SSRF no WordPress

O diretório `wp-content/uploads/leopard-wordpress-offload/` contém entradas suspeitas (evil.com, oast.pro, viet.cgovn.cc, alibaba.interact.sh, 100.100.100.200). Pode indicar escaneamento SSRF externo ou teste de segurança. Wordfence está ativo — verificar logs em `/home/carolinemoschei.com/public_html/wp-content/wflogs/`.

---

## Novo Site (WeTransfer — em desenvolvimento)

### Stack do novo site

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML estático + CSS (sem framework) |
| Display font | Cormorant Garamond (serif, Google Fonts) |
| Body font | Inter (sans-serif, Google Fonts) |
| Backend Lives | Node.js/Express + SQLite (Docker, porta 3001) |
| Backend admin | Flask/Python (porta 8080) |
| Infraestrutura | Docker Compose |

### Design System do novo site

| Token | Hex | Uso |
|-------|-----|-----|
| Ink | `#080808` | Fundos escuros |
| Bone | `#F0EBE3` | Texto sobre escuro |
| Cream | `#FAF4ED` | Fundos claros |
| Caramel | `#C8956C` | CTAs e acentos |
| Gold | `#D4A574` | Texto destacado |
| Warm Gray | `#7A756F` | Texto secundário |

### Páginas já construídas no novo site

| Página | Arquivo | Status |
|--------|---------|--------|
| Link-in-bio | index.html | Pronto |
| Verso & Reverso (landing) | site/verso-e-reverso.html | Pronto |
| Presets | site/presets.html | Pronto |
| Portfólio | site/portfolio.html | Pronto |
| Lives (player + auth) | site/lives.html | Pronto |
| Admin Lives | site/admin-lives.html | Pronto |
| Guia Corporativo | site/guia-corporativo.html | Pronto |
| Guia Gestantes | site/guia-gestantes.html | Pronto |
| Guia Iluminação | site/guia-iluminacao.html | Pronto |
| Guia Poses Pessoal | site/guia-pessoal-criativo.html | Pronto |
| Combo Tratamento | site/combo-tratamento.html | Pronto |
| Collab Guia Viagem | site/collab-guia-viagem/ | Pronto |

**CLAUDE.md incluso:** o projeto foi desenvolvido com IA (Hermes/Claude). Regras críticas de CSS e arquitetura documentadas.

---

## Catálogo de Produtos

| Produto | Tipo | Checkout |
|---------|------|----------|
| Verso & Reverso | Workshop online | Hotmart |
| Presets | Pack de presets Lightroom | — |
| Guia Fotografia Corporativa | Guia digital | — |
| Guia Fotografia Gestantes | Guia digital | — |
| Guia Iluminação de Estúdio | Guia digital | — |
| Guia Poses Pessoal e Criativo | Guia digital | — |
| Combo Tratamento (Photoshop/LR) | Workshop | — |
| Academy | Curso (EAD) | — |
| ART-Sessions | Sessão fotográfica | — |
| Workshop Presencial | Workshop | — |
| Mentoria | Serviço | — |
| Orçamentos | Serviço | — |

---

## Contexto Prévio

Projeto novo — **sem histórico anterior** no sistema de memória ou sessões da Hermes. Discovery iniciada em 2026-05-15.

---

## Arquivos de Referência

| Doc | Conteúdo |
|-----|----------|
| `docs/02-wetransfer-inventory.md` | Inventário completo do zip (660 arquivos) |
| `docs/03-vps-structure.md` | Estrutura VPS, tokens visuais WordPress, alertas segurança |
| `docs/04-visual-discovery.md` | Screenshots, stack confirmado, domínio parked |
| `docs/05-prior-context.md` | Histórico de sessões (vazio — projeto novo) |
| `vps-snapshot/wp-content/` | Snapshot local do WordPress (2.9GB) |
| `incoming/caroline-moschei-project.zip` | Arquivo original do WeTransfer |
| `reference/` | Código-fonte do novo site descompactado |

---

## Perguntas para Nathan

1. **Domínio .com parked** — Foi intencional? O novo site vai para o .com?
2. **SSRF no Wordfence** — Sabe de algum incidente de segurança no site WP?
3. **Próximo passo no novo site** — O que falta para o novo site ir ao ar? Deploy, ajustes, conteúdo?
4. **Backend em Docker** — O sistema de lives vai para o mesmo VPS Hostinger?
5. **Credenciais do Typekit** — A licença da fonte Monik vai continuar ou vai usar Cormorant Garamond no novo site?
