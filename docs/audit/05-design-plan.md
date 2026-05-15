# Audit 05 — Design Expert Review + Plano Final do Funil

**Data:** 2026-05-15
**Worker:** t_b1c1d8c0
**Status:** AGUARDANDO APROVAÇÃO NATHAN antes da implementação

---

## Análise Crítica (persona: UX/UI designer sênior)

### O que o site atual tem de errado:
1. Hero sem VSL — vídeo de produto é o maior conversor de cursos premium
2. Sem seção de depoimentos real com fotos/screenshots de alunos
3. Preço apresentado cedo demais, sem construção de valor suficiente
4. Bio de Caroline vem DEPOIS do curriculum — deve vir antes (autoridade primeiro)
5. 20 módulos listados sem hierarquia visual — cansa o leitor

### O que funciona e deve ser preservado:
1. Paleta de cores warm/dark — já está correta no design system
2. Estrutura hero→valor→prova→preço→garantia
3. Checkout Hotmart (URL preservada)
4. Facebook Pixel (preservado)

### Auto-crítica 1ª versão do plano:
- Tentei usar demasiadas seções → simplificar para 8 seções essenciais
- Depoimentos devem usar fotos reais dos alunos, não apenas texto
- Não inclui barra de urgência / countdown — pode testar

### Auto-crítica 2ª versão (após refinamento):
- VSL na hero é essencial dado o material de vídeo novo (Video 2 music.mp4)
- A página de guias consolidada precisa ser hub navegável, não só links

---

## Layout ASCII — Funil Verso & Reverso

```
┌─────────────────────────────────────────────────┐
│  [STICKY NAV]  logo ·····················  [CTA] │
├─────────────────────────────────────────────────┤
│                                                 │
│  SEÇÃO 1: HERO                                 │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │  "Conheça e explore todas as versões       │  │
│  │   que a sua fotografia pode ter"           │  │
│  │                                           │  │
│  │  [██████████  VSL VIDEO  ██████████████]  │  │
│  │        ▶ Assistir apresentação             │  │
│  │                                           │  │
│  │  [QUERO ME INSCREVER  →]                  │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  SEÇÃO 2: AUTORIDADE CAROLINE                  │
│  ┌──────────┐  ┌───────────────────────────┐   │
│  │  [FOTO]  │  │ Caroline Moschei           │   │
│  │          │  │ Fotógrafa profissional      │   │
│  │          │  │ 10+ países · X anos        │   │
│  └──────────┘  └───────────────────────────┘   │
│  [   X mil  ] [ X anos ] [ X países ] [  X  ]  │
│                                                 │
│  SEÇÃO 3: PARA QUEM É (3 CARDS DE DOR)         │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │
│  │ Está    │  │ Fotóg.  │  │ Pensando em │    │
│  │iniciando│  │ sem $   │  │ desistir    │    │
│  └─────────┘  └─────────┘  └─────────────┘    │
│                                                 │
│  SEÇÃO 4: OS 4 PILARES (METODOLOGIA)           │
│  [🔷 FOTOGRAFIA] [🔷 ILUMINAÇÃO]               │
│  [🔷 CORES]      [🔷 TRATAMENTO]               │
│                                                 │
│  SEÇÃO 5: MÓDULOS (ACCORDION — 20 módulos)     │
│  ┌───────────────────────────────────────────┐  │
│  │ ▶ 01. Sejam bem-vindos                    │  │
│  │ ▶ 02. Antes de começar a jornada          │  │
│  │ ▶ 03. Quem sou eu                         │  │
│  │ ............................               │  │
│  │ ▶ 20. Jurídico e contratos                │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  SEÇÃO 6: DEPOIMENTOS DE ALUNOS                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ [Foto]   │  │ [Foto]   │  │  [Screenshot]│  │
│  │ "Lorem"  │  │ "Lorem"  │  │  mensagem    │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                 │
│  SEÇÃO 7: OFERTA + BÔNUS                       │
│  ┌───────────────────────────────────────────┐  │
│  │            ACESSO ANUAL                   │  │
│  │    ╔══════════════════════════════╗       │  │
│  │    ║    12x de R$206,54           ║       │  │
│  │    ║  ou R$1.997,00 à vista       ║       │  │
│  │    ╚══════════════════════════════╝       │  │
│  │  ✓ +125 aulas   ✓ +60h conteúdo           │  │
│  │  ✓ Presets      ✓ Materiais de apoio      │  │
│  │  ✓ Comunidade Discord VIP                 │  │
│  │                                           │  │
│  │  [GARANTIR MINHA VAGA  →]                │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  SEÇÃO 8: GARANTIA                             │
│  ┌───────────────────────────────────────────┐  │
│  │  🛡 7 dias de garantia incondicional      │  │
│  │  Cancele e receba de volta, sem perguntas  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  SEÇÃO 9: FAQ                                  │
│  ▶ Preciso de câmera profissional?             │
│  ▶ Quanto tempo tenho acesso?                  │
│  ▶ É ao vivo ou gravado?                       │
│  ▶ Serve para iniciantes completos?            │
│  ▶ Como funciona o cancelamento?               │
│                                                 │
│  SEÇÃO 10: CTA FINAL                           │
│  ┌───────────────────────────────────────────┐  │
│  │  "Está pronta para explorar todas as       │  │
│  │   versões da sua fotografia?"              │  │
│  │  [QUERO COMEÇAR AGORA  →]                 │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  FOOTER: © 2026 Caroline Moschei · Privacidade │
└─────────────────────────────────────────────────┘
```

---

## Decisões Técnicas

| Decisão | Escolha | Razão |
|---------|---------|-------|
| VSL player | YouTube iframe unlisted | Hospedagem gratuita, sem custo servidor |
| Tipografia display | Cormorant Garamond | Editorial, sofisticado, Google Fonts (free) |
| Tipografia headlines | Monik | Já disponível local, identidade da marca |
| Tipografia body | Inter | Leitura em tela, já carregado |
| Imagens hero | fotos da Caroline das referências | WebP, já otimizadas |
| Accordion módulos | CSS puro (details/summary) | Zero JS overhead |
| Checkout | Hotmart pay.hotmart.com/E64464708W | Manter URL atual |
| Facebook Pixel | 1559920731501893 | Manter, já configurado |

---

## Página Consolidada Guias de Poses

**Route:** /pages/guia-de-poses.html

**Estrutura:**
```
┌─────────────────────────────────────────────────┐
│  HERO: "Cada ensaio conta uma história"         │
│  [Hub de guias — escolha o seu]                 │
├──────────┬──────────┬──────────┬────────────────┤
│ CORPORA  │ GESTAND  │ PESSOAL  │  ILUMINAÇÃO    │
│  [foto]  │  [foto]  │  [foto]  │  [foto]        │
│  CARD    │  CARD    │  CARD    │  CARD          │
│  →VER    │  →VER    │  →VER    │  →VER          │
└──────────┴──────────┴──────────┴────────────────┘
  + CTA para Verso & Reverso (o curso completo)
```

---

## Branch de Implementação

`task/funil-redesign-2026`

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| pages/funil/index.html | Funil Verso & Reverso |
| pages/funil/funil.css | CSS dedicado do funil |
| pages/guia-de-poses.html | Hub consolidado dos guias |
| pages/guia-de-poses.css | CSS do hub |

## Arquivo a Atualizar

- pages/verso-reverso.html → pode redirecionar para pages/funil/ ou ser o próprio funil

---

## Perguntas para Nathan

1. O "Video 2 music.mp4" (1.4GB) é o VSL do funil de Verso & Reverso? Se sim, qual URL do YouTube?
2. Há depoimentos de alunos (fotos ou screenshots de mensagens) disponíveis?
3. Confirmar: o checkout permanece em pay.hotmart.com/E64464708W?
4. A página do funil vai substituir a homepage de carolinemoschei.site ou vai ser separada?
