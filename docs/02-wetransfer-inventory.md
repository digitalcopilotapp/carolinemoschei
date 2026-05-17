# SUB-1: WeTransfer Inventário — caroline-moschei-project.zip

**Data:** 2026-05-15  
**Link:** https://we.tl/t-sCh9N4nWW1gPjpDA (expira em ~2 dias)  
**Arquivo:** `caroline-moschei-project.zip` — 84 MB  
**Destino local:** `/home/hermes/projects/carolinemoschei/incoming/caroline-moschei-project.zip`  
**Extraído em:** `/home/hermes/projects/carolinemoschei/reference/`  
**Total de arquivos:** 660 arquivos

---

## ⭐ DESCOBERTA PRINCIPAL

O WeTransfer NÃO contém um backup WordPress. Contém um **projeto de site customizado em HTML/CSS/JS + backend Node.js**, desenvolvido com CLAUDE.md — ou seja, já foi trabalhado com IA anteriormente.

Este é o **novo site de carolinemoschei.com**, em desenvolvimento ativo, que substituirá o WordPress atual.

---

## Estrutura do Projeto

```
caroline-moschei-project/
├── CLAUDE.md                    ← Guia do projeto para IA (arquitetura, design system, regras)
├── index.html                   ← Link-in-bio principal (CSS inline)
├── requirements.txt             ← Flask app (Python)
├── docker-compose.yml           ← Backend Node.js em Docker
├── Dockerfile                   ← Container para Flask
│
├── site/                        ← 85MB — Páginas do site + assets
│   ├── index.html               ← Link-in-bio (cópia)
│   ├── lives.html               ← Player de lives com auth
│   ├── admin-lives.html         ← Painel admin de lives
│   ├── verso-e-reverso.html     ← Landing page do curso Verso & Reverso
│   ├── verso.css                ← CSS do Verso & Reverso
│   ├── presets.html             ← Página de presets
│   ├── portfolio.html           ← Portfólio fotográfico
│   ├── combo-tratamento.html    ← Combo workshop tratamento
│   ├── guia-corporativo.html    ← Guia Fotografia Corporativa
│   ├── guia-gestantes.html      ← Guia Fotografia Gestantes
│   ├── guia-iluminacao.html     ← Guia Iluminação de Estúdio
│   ├── guia-pessoal-criativo.html ← Guia Poses Pessoal e Criativo
│   ├── guia.css                 ← CSS compartilhado dos guias
│   ├── style.css                ← CSS global do site
│   ├── assets/                  ← Banners e logos (PNG/WebP/SVG)
│   ├── photos/                  ← 40 fotos (photo_001–040, JPG+WebP)
│   ├── portfolio/               ← ~80 fotos de portfólio (WebP)
│   ├── pages/                   ← Páginas com assets inline
│   └── collab-guia-viagem/      ← Página de collab especial
│
├── fotos-optimized/             ← Fotos WebP por categoria de produto
│   ├── workshop presencial/
│   ├── Guia de Poses Gestantes_/
│   ├── guia de poses pessoal e criativo_/
│   ├── Guia de iluminação_/
│   └── Guia de Poses corporativo/
│
├── app/                         ← Flask backend (Python)
│   ├── __init__.py
│   ├── auth.py
│   ├── config.py
│   ├── models.py
│   ├── routes_admin.py
│   ├── routes_api.py
│   ├── routes_public.py
│   └── utils.py
│
├── templates/                   ← Jinja2 templates Flask
│   ├── admin/                   ← Dashboard, leads, lives, login
│   └── public/                  ← Lives player, watch page
│
├── docker/                      ← Backend Node.js/Express
│   └── backend/
│       ├── server.js            ← API REST (lives, auth, leads)
│       ├── package.json
│       └── Dockerfile
│
└── static/                      ← CSS estático do Flask
    └── css/
```

---

## Design System do Novo Site

| Token | Hex | CSS Variable | Uso |
|-------|-----|-------------|-----|
| Ink | `#080808` | `--ink` | Fundos escuros |
| Bone | `#F0EBE3` | `--bone` | Texto sobre escuro |
| Cream | `#FAF4ED` | `--cream` | Fundos claros |
| Caramel | `#C8956C` | `--caramel` | CTAs, acentos, bordas |
| Gold | `#D4A574` | `--gold` | Texto destacado |
| Warm Gray | `#7A756F` | `--warm-gray` | Texto secundário |

**Tipografia:**
- Display (headings): **Cormorant Garamond** (serif, 300–600)
- Body: **Inter** (sans-serif, 300–500)

---

## Funcionalidades Implementadas

### Backend Node.js (Docker porta 3001)
- Sistema de lives com YouTube embed + lead capture
- Autenticação JWT (usuários e admin)
- Upload de avatar (base64)
- Admin panel: gerenciar lives, ver leads, listar usuários

### Backend Flask (Python, porta 8080)
- Lives públicas e admin
- Leads / comentários
- Dashboard admin

### Frontend
- Link-in-bio principal (`index.html`)
- Landing pages por produto (Verso & Reverso, Presets, Guias, Combo)
- Player de lives com overlay de anúncio configurável
- Portfólio fotográfico
- Página de collab (guia viagem)

---

## Regras Críticas (do CLAUDE.md)

1. `index.html` tem CSS INLINE na tag `<style>` — não há arquivo CSS externo
2. Fotos sempre em WebP quando disponível, `object-position: center top`
3. Carousels: nunca `overflow: hidden` no elemento com `translateX` — usar wrapper `.carousel__viewport`
4. Lives frontend conecta em `http://localhost:3001/api/` com fallback para lives hardcoded
5. Tokens auth: `carol_user_token` e `carol_admin_token` no localStorage

---

## Inventário de Mídia

| Categoria | Quantidade | Formato |
|-----------|-----------|---------|
| Fotos principais (photos/) | 40 fotos | JPG + WebP |
| Portfólio (portfolio/) | ~80 fotos | WebP |
| Fotos otimizadas por produto | 5 pastas | WebP |
| Banners de produto (assets/) | 10 banners | PNG/WebP |
| Logo/ícones (assets/) | 2 arquivos | SVG |
| Profile Instagram | 1 foto | JPG |

---

## Conclusão SUB-1

O WeTransfer contém o código-fonte do **novo carolinemoschei.com** — uma migração completa de WordPress+Elementor para site HTML estático + Node.js. O projeto já tem CLAUDE.md, portanto foi (ou está sendo) desenvolvido com assistência de IA. O designer system usa paleta Ink/Cream/Caramel (editorial, quente) com Cormorant Garamond + Inter.
