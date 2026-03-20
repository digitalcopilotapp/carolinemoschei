# Prompt para criar campanha Meta Ads completa

Crie a campanha completa no Meta Ads usando as ferramentas do Pipeboard Meta Ads MCP. Siga EXATAMENTE esta estrutura. Crie tudo PAUSADO. Execute passo a passo, esperando cada resposta antes de continuar.

## DADOS DA CONTA

- Account ID: `act_1080486722552440`
- Page ID: `515416671875240` (Caroline Moschei Fotografia)
- Instagram Actor ID: `17841400894663689` (@carolinemoschei)
- Pixel ID: `1559920731501893` (Pixel - Caroline Moschei)
- URL de destino: `https://carolinemoschei.site/collab-guia-pessoal-de-viagem/`
- url_tags: `utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}&xcod=FBhQwK21wXxR{{campaign.name}}|{{campaign.id}}hQwK21wXxR{{adset.name}}|{{adset.id}}hQwK21wXxR{{ad.name}}|{{ad.id}}hQwK21wXxR{{placement}}`

---

## PASSO 1: CRIAR CAMPANHA (CBO)

Crie UMA campanha com:
- name: `GV26 | Guia Viagem | CBO | Advantage+`
- objective: `OUTCOME_SALES`
- status: `PAUSED`
- special_ad_categories: `[]`
- buying_type: `AUCTION`
- daily_budget: `10000` (R$100/dia em centavos)
- bid_strategy: `LOWEST_COST_WITHOUT_CAP`

Guarde o campaign_id retornado.

---

## PASSO 2: CRIAR 5 AD SETS

Crie 5 ad sets dentro da campanha criada. TODOS com:
- optimization_goal: `OFFSITE_CONVERSIONS`
- billing_event: `IMPRESSIONS`
- status: `PAUSED`
- bid_strategy: `LOWEST_COST_WITHOUT_CAP`
- destination_type: `WEBSITE`
- promoted_object: `{"pixel_id": "1559920731501893", "custom_event_type": "PURCHASE"}`
- targeting: `{"geo_locations": {"countries": ["BR"]}, "age_min": 18, "age_max": 65, "genders": [2], "targeting_automation": {"advantage_audience": 1}}`

SEM daily_budget nos ad sets (CBO distribui pela campanha).

Nomes:
1. `AS1_Inconsciente | Broad | W18-65`
2. `AS2_Problema | Broad | W18-65`
3. `AS3_Solucao | Broad | W18-65`
4. `AS4_Produto | Broad | W18-65`
5. `AS5_Consciente | Broad | W18-65`

Guarde os 5 adset_ids.

---

## PASSO 3: CRIAR 30 AD CREATIVES (FLEX/Advantage+)

Para cada criativo abaixo, crie um ad creative FLEX (Advantage+ Creative) com:
- optimization_type: `DEGREES_OF_FREEDOM`
- page_id: `515416671875240`
- instagram_actor_id: `17841400894663689`
- link_url: `https://carolinemoschei.site/collab-guia-pessoal-de-viagem/`
- url_tags: (os UTMs acima)
- creative_features_spec: `{"standard_enhancements": {"enroll_status": "OPT_IN"}}`

Como NAO temos as imagens uploadadas ainda, crie os creatives com image_hash placeholder. Eu farei o upload depois e atualizarei.

ALTERNATIVA: Se nao for possivel criar sem imagem, pule este passo e passe para o PASSO 3B.

### PASSO 3B: Upload de imagens primeiro

As imagens estao em arquivos locais. Para cada criativo, preciso fazer upload de 2 imagens (Dark + White no formato Stories 9:16).

O caminho dos arquivos segue o padrao:
`ads/criativos_raw/Anuncios Guia Viagem 2026- Caroline Moschei e Jenniffer Thalia/{STAGE_FOLDER}/{TIPO}/{VERSAO}/{TEMA}/Stories/{TIPO}_{VERSAO}_{TEMA}_Stories.png`

Onde STAGE_FOLDER e:
- 01: `01 - Inconsciente`
- 02: `02 - Problema`
- 03: `03 - Solucao` (com encoding especial no ç)
- 04: `04 - Produto`
- 05: `05 - Consciente`

EXCECAO Stage 03: A pasta e V11/V12/V13 mas o nome do arquivo usa VAR08/VAR09/VAR10:
- V11 -> arquivo Cards_VAR08_*
- V12 -> arquivo Cards_VAR09_*
- V13 -> arquivo Cards_VAR10_*

---

## COPIES, HEADLINES E CTAs POR ESTAGIO

### Stage 01 - Inconsciente
**CTA:** LEARN_MORE
**Primary Text (message):**
```
Voce viaja, tira centenas de fotos... e quando volta, nao gosta de nenhuma.

Angulo errado. Pose forcada. Roupa que nao combinou com o cenario. Luz estourada.

E a sensacao de que desperdicou momentos unicos que nunca mais vao se repetir.

Foi pensando nisso que a Caroline Moschei (fotografa ha 12 anos, 10+ paises) e a Jenniffer Thalia (consultora de imagem formada na Marangoni de Milao) criaram o Guia de Poses e Fotos de Viagem.

105 paginas com +100 poses por cenario, guia de looks por destino, tecnicas de luz e angulo — tudo pra voce nunca mais voltar de viagem frustrada com suas fotos.

De R$ 159,80 por apenas R$ 79,90 (ou 12x R$ 7,99)
7 dias de garantia incondicional.

Toque em "Saiba Mais" e garanta o seu.
```
**Primary Text ALT (messages[1]):**
```
Tem uma coisa que separa as fotos de viagem que voce ama das que voce esconde...

Nao e a camera.
Nao e o destino.
Nao e nem o fotografo.

E saber COMO se posicionar, o que vestir e quando apertar o botao.

E isso ninguem te ensinou — ate agora.

O Guia de Poses e Fotos de Viagem tem 105 paginas com tudo que voce precisa pra transformar qualquer cenario em uma foto que voce vai AMAR.

Preco de lancamento: R$ 79,90 (50% OFF)
```
**Headlines (5):**
1. `Suas fotos de viagem vao mudar pra sempre`
2. `O segredo das fotos perfeitas de viagem`
3. `Isso muda tudo nas suas fotos`
4. `Ninguem te ensinou isso sobre fotos`
5. `Descubra o que faltava nas suas fotos`

**Descriptions (3):**
1. `Guia completo 105 paginas`
2. `+100 poses de viagem`
3. `Descubra o que faltava`

---

### Stage 02 - Problema
**CTA:** LEARN_MORE
**Primary Text:**
```
+20 mil mulheres ja transformaram suas fotos de viagem com esse guia.

E nao e exagero.

Caroline Moschei fotografa profissionalmente ha mais de 12 anos em mais de 10 paises. Jenniffer Thalia e consultora de imagem formada no Istituto Marangoni de Milao e seguida por 2.4 milhoes de mulheres.

Juntas, elas criaram um guia de 105 paginas que ensina:

- +100 variacoes de pose por cenario
- Looks ideais para cada destino (Paris, Milao, Miami...)
- Tecnicas de golden hour e iluminacao
- Angulos que valorizam qualquer tipo de corpo
- Composicao e narrativa visual

Tudo isso por apenas R$ 79,90.

Acesso imediato + garantia de 7 dias.
```
**Primary Text ALT:**
```
Se voce se identifica com PELO MENOS uma dessas situacoes:

- Nao sabe o que fazer com as maos nas fotos
- Escolhe roupas que nao combinam com o cenario
- Suas fotos sempre saem com angulo estranho
- Perde a melhor luz porque nao sabe o horario certo
- Volta de viagem sem nenhuma foto que ame
- Fica travada na frente da camera

...esse guia foi feito EXATAMENTE pra voce.

105 paginas. +100 poses. 10+ paises. Guia de looks por destino.

Criado por uma fotografa profissional + consultora de imagem da Marangoni.

R$ 79,90 | Acesso imediato | Garantia de 7 dias
```
**Headlines (5):**
1. `Cansada de odiar suas fotos de viagem?`
2. `Ja voltou de viagem sem nenhuma foto boa?`
3. `Sabe por que suas fotos nao ficam boas?`
4. `Voce esta posando errado (e nem sabe)`
5. `Pare de desperdicar suas fotos de viagem`

**Descriptions (3):**
1. `+20 mil alunas aprovam`
2. `Poses + Looks + Destinos`
3. `Transforme suas fotos`

---

### Stage 03 - Solucao
**CTA:** SHOP_NOW
**Primary Text:**
```
A Caroline ja fotografou em mais de 10 paises.

A Jenniffer se formou em consultoria de imagem em Milao e tem 2.4 milhoes de seguidoras.

Mas as duas perceberam a mesma coisa: a maioria das mulheres que viajam voltam FRUSTRADAS com suas fotos.

"Nao sei posar."
"Escolhi a roupa errada."
"A luz tava horrivel."

Entao elas decidiram resolver isso de uma vez.

Criaram um guia de 105 paginas com TUDO que voce precisa: poses, angulos, looks, iluminacao, composicao e ate recomendacoes de restaurantes fotogenicos em cada destino.

Preco de lancamento: R$ 79,90 (metade do preco)
Garantia: 7 dias ou seu dinheiro de volta.
```
**Headlines (5):**
1. `Fotos incriveis sem saber fotografar`
2. `Poses perfeitas em qualquer destino`
3. `Guia completo: poses, looks e destinos`
4. `+100 poses para suas fotos de viagem`
5. `Looks + Poses + Angulos = Foto perfeita`

**Descriptions (3):**
1. `Por Caroline e Jenniffer`
2. `Guia completo 105 paginas`
3. `Acesso imediato ao guia`

---

### Stage 04 - Produto
**CTA:** SHOP_NOW
**Primary Text:**
```
Guia Digital de Poses e Fotos de Viagem

105 paginas com:
- +100 poses por cenario
- Guia de looks para Paris, Milao, Miami e mais 7 destinos
- Tecnicas de golden hour e iluminacao natural
- Angulos e composicao que funcionam
- Recomendacoes de restaurantes e cafes fotogenicos
- Acesso vitalicio + downloads ilimitados

Criado por Caroline Moschei (fotografa, 12+ anos) e Jenniffer Thalia (consultora de imagem, Marangoni Milan).

+20 mil alunas.

De R$ 159,80 por R$ 79,90
12x R$ 7,99 | Garantia de 7 dias

Acesso imediato apos a compra.
```
**Headlines (5):**
1. `105 paginas que transformam suas fotos`
2. `De amadora a profissional em 1 guia`
3. `Seu guia pessoal de fotos de viagem`
4. `Criado por fotografa com 12 anos de experiencia`
5. `+20 mil alunas ja transformaram suas fotos`

**Descriptions (3):**
1. `Acesso imediato ao guia`
2. `12x R$ 7,99 sem juros`
3. `Garantia de 7 dias`

---

### Stage 05 - Consciente
**CTA:** SHOP_NOW
**Primary Text:**
```
Se voce ja pensou em comprar o Guia de Poses e Fotos de Viagem...

Esse e o momento.

O preco de lancamento de R$ 79,90 (50% OFF) nao vai durar muito.

Sao 105 paginas criadas por uma fotografa profissional e uma consultora de imagem formada em Milao — com +100 poses, guia de looks e tecnicas que +20 mil mulheres ja usam.

Voce pode continuar voltando de viagem frustrada com suas fotos...

Ou pode resolver isso agora por menos de R$ 80.

Escolha.
```
**Headlines (5):**
1. `De R$ 159 por apenas R$ 79,90`
2. `Oferta de lancamento: 50% OFF`
3. `12x R$ 7,99 - Acesso imediato`
4. `Garanta antes que o preco suba`
5. `Preco de lancamento por tempo limitado`

**Descriptions (3):**
1. `50% OFF - Lancamento`
2. `Acesso imediato ao guia`
3. `Garantia de 7 dias`

---

## LISTA DOS 30 CRIATIVOS E SEUS AD SETS

Cada criativo gera 1 ad creative FLEX + 1 ad. Use o nome padrao:
- Creative: `CR_S{STAGE}_{TIPO}_{VERSAO} | FLEX | {CTA}`
- Ad: `AD_S{STAGE}_{TIPO}_{VERSAO} | {TIPO}_{VERSAO}`

### Ad Set 1 - AS1_Inconsciente (8 anuncios)
| # | Stage | Tipo | Versao |
|---|-------|------|--------|
| 1 | 01 | Cards | V01 |
| 2 | 01 | Cards | V02 |
| 3 | 01 | Cards | V03 |
| 4 | 01 | Cards | V08 |
| 5 | 01 | Mosaico | V01 |
| 6 | 01 | Mosaico | V02 |
| 7 | 01 | Mosaico | V03 |
| 8 | 01 | Mosaico | V04 |

### Ad Set 2 - AS2_Problema (8 anuncios)
| # | Stage | Tipo | Versao |
|---|-------|------|--------|
| 9 | 02 | Cards | V01 |
| 10 | 02 | Cards | V02 |
| 11 | 02 | Cards | V03 |
| 12 | 02 | Cards | V06 |
| 13 | 02 | Mosaico | V01 |
| 14 | 02 | Mosaico | V02 |
| 15 | 02 | Mosaico | V03 |
| 16 | 02 | Mosaico | V04 |

### Ad Set 3 - AS3_Solucao (4 anuncios)
| # | Stage | Tipo | Versao |
|---|-------|------|--------|
| 17 | 03 | Cards | V09 |
| 18 | 03 | Cards | V10 |
| 19 | 03 | Cards | V12 |
| 20 | 03 | Cards | V13 |

### Ad Set 4 - AS4_Produto (6 anuncios)
| # | Stage | Tipo | Versao |
|---|-------|------|--------|
| 21 | 04 | Cards | V01 |
| 22 | 04 | Cards | V02 |
| 23 | 04 | Cards | V03 |
| 24 | 04 | Cards | V04 |
| 25 | 04 | Cards | V06 |
| 26 | 04 | Cards | V07 |

### Ad Set 5 - AS5_Consciente (4 anuncios)
| # | Stage | Tipo | Versao |
|---|-------|------|--------|
| 27 | 05 | Cards | V01 |
| 28 | 05 | Cards | V02 |
| 29 | 05 | Cards | V05 |
| 30 | 05 | Cards | V06 |

---

## INSTRUCOES DE EXECUCAO

1. Crie a campanha CBO primeiro
2. Crie os 5 ad sets (pode ser em paralelo)
3. Para as imagens: como sao arquivos locais, preciso fazer upload separadamente. Pule a criacao de creatives/ads por enquanto se nao tiver as imagens.
4. Se tiver acesso aos arquivos locais, leia cada imagem PNG, converta para base64 e use upload_ad_image com o campo `file` no formato `data:image/png;base64,{BASE64_DATA}`
5. Depois do upload, crie os creatives FLEX com image_hashes (Dark + White) e as copies/headlines do estagio correspondente
6. Por fim, crie os 30 ads linkando creative ao ad set correto

TUDO PAUSADO. Nao ative nada.
