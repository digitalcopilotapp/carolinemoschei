# PRD — Infraestrutura de Email, Campanhas, CRM & Tracking de Conversoes

**Dominio:** mail.digitalcopilot.app
**Plataforma:** Hostinger KVM 2 (2 vCPU | 8GB RAM | 100GB NVMe)
**Preparado para:** Nathan | Digital Copilot
**Data:** 14 de Marco de 2026 | Versao 3.0

---

## Sumario

1. [Visao Geral do Projeto](#1-visao-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Servidor de Email (Stalwart Mail)](#3-servidor-de-email-stalwart-mail)
4. [Cliente de Email (SnappyMail)](#4-cliente-de-email-snappymail)
5. [Plataforma de Campanhas (Listmonk)](#5-plataforma-de-campanhas-listmonk)
6. [CRM & WhatsApp (Chatwoot)](#6-crm--whatsapp-chatwoot)
7. [Tracking Avancado & Meta Conversions API](#7-tracking-avancado--meta-conversions-api)
8. [Integracao Hotmart (dc-bridge)](#8-integracao-hotmart-dc-bridge)
9. [Seguranca e Boas Praticas](#9-seguranca-e-boas-praticas)
10. [Plano de Entrega](#10-plano-de-entrega)
11. [Estimativa de Custos Mensais](#11-estimativa-de-custos-mensais)
12. [Riscos e Mitigacoes](#12-riscos-e-mitigacoes)
13. [Metricas de Sucesso](#13-metricas-de-sucesso)
14. [Consumo Estimado de Recursos](#14-consumo-estimado-de-recursos)

---

## 1. Visao Geral do Projeto

Este documento define os requisitos, a arquitetura tecnica e o plano de entrega para a construcao de uma infraestrutura completa de marketing digital self-hosted, rodando em um unico servidor KVM 2 da Hostinger. O projeto abrange quatro pilares fundamentais: servidor de email proprio com suporte multi-dominio, plataforma de campanhas e newsletters, CRM com automacao via WhatsApp, e sistema de tracking avancado com integracao Meta Conversions API (CAPI).

### 1.1 Objetivos Estrategicos

- Eliminar dependencia de servicos SaaS de email marketing (Brevo, Mailchimp, etc.)
- Centralizar o envio de emails de todos os projetos em um unico servidor controlado
- Ter caixas de entrada profissionais com webmail moderno para cada projeto
- CRM integrado com WhatsApp API para automacao de mensagens por evento (compra, abandono de carrinho, etc.)
- Capturar 95%+ das conversoes via tracking server-side (Meta CAPI)
- Integrar compras da Hotmart automaticamente ao funil de conversoes da Meta
- Construir um banco de dados proprio de leads e conversoes para analise e retargeting

### 1.2 Stack Tecnologica

| Componente | Tecnologia | Funcao |
|---|---|---|
| Servidor de Email | **Stalwart Mail** (Rust) | SMTP, IMAP, JMAP, antispam, DKIM/SPF/DMARC |
| Campanhas | **Listmonk** (Go) | Newsletters, listas, agendamento, templates, analytics |
| Banco de Dados | **PostgreSQL 15** | Armazenamento de Listmonk + Chatwoot + leads/conversoes |
| Webmail | **SnappyMail** (PHP/JS) | Cliente de email moderno, leve e rapido |
| CRM + WhatsApp | **Chatwoot** (Ruby/Rails) | CRM, chat omnichannel, WhatsApp Business API, automacoes |
| Webhook Bridge | **dc-bridge** (Node.js) | Microservico: Hotmart -> DB -> Meta CAPI -> Listmonk -> Chatwoot |
| Tracking Server-Side | **sGTM via Stape.io** | Meta CAPI, deduplicacao de eventos, EMQ otimizado |
| Proxy Reverso | **Caddy** | SSL automatico, roteamento de subdominios |
| Monitoramento | **Uptime Kuma** | Health checks de todos os servicos |

> **Por que dc-bridge em vez de n8n?** O n8n consome ~500MB de RAM e adiciona complexidade para um fluxo essencialmente linear. O dc-bridge e um script Node.js dedicado (~50MB RAM) que faz webhook -> processar -> salvar -> enviar, com retry queue via PostgreSQL. Com o Chatwoot agora na stack, cada MB de RAM conta — o dc-bridge economiza ~450MB comparado ao n8n.

> **Por que Stape.io para sGTM e nao self-hosted?** O Server-Side GTM auto-hospedado exige manter containers GCP com alta disponibilidade. O Stape.io custa $20/mes, inclui Custom Loader (anti-adblocker), Cookie Keeper (atribuicao 90+ dias), e suporte direto. CPA 12-15% menor vs. tracking client-side.

---

## 2. Arquitetura do Sistema

### 2.1 Diagrama de Componentes (Docker Compose)

Todos os servicos rodam em containers Docker no mesmo servidor KVM 2, conectados via rede interna Docker. O Caddy e o unico ponto de entrada externo para servicos web.

```
                         INTERNET
                            |
                   [Hostinger KVM 2]
                   2 vCPU | 8GB RAM
    ____________________|________________________
   |        |         |        |        |        |
 :25/:587  :443      :443    :443     :443     :443
   |        |         |        |        |        |
[Stalwart] [Caddy]  [Caddy] [Caddy]  [Caddy]  [Caddy]
  Mail    Listmonk  Snappy  Chatwoot dc-bridge UptimeK
   |        |        Mail      |        |        |
   |    [PostgreSQL 15]    [Redis]      |        |
   |    Listmonk + Leads   Chatwoot     |        |
   |    + Chatwoot DB       Cache       |        |
   |________|_______________|___________|________|
```

### 2.2 Mapeamento de Subdominios e Portas

| Subdominio | Servico | Porta Interna | Porta Externa |
|---|---|---|---|
| mail.digitalcopilot.app | Stalwart Mail (SMTP/IMAP) | 25, 587, 465, 993 | 25, 587, 465, 993 |
| campaigns.digitalcopilot.app | Listmonk (Web UI + API) | 9000 | 443 (HTTPS) |
| webmail.digitalcopilot.app | SnappyMail | 8888 | 443 (HTTPS) |
| crm.digitalcopilot.app | Chatwoot (CRM + WhatsApp) | 3000 | 443 (HTTPS) |
| webhook.digitalcopilot.app | dc-bridge (Webhook API) | 3100 | 443 (HTTPS) |
| status.digitalcopilot.app | Uptime Kuma | 3001 | 443 (HTTPS) |

### 2.3 Registros DNS Necessarios

Para cada dominio de projeto que enviara emails, os seguintes registros DNS sao obrigatorios:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | mail.digitalcopilot.app | [IP do KVM] | 3600 |
| MX | digitalcopilot.app | mail.digitalcopilot.app (prioridade 10) | 3600 |
| TXT | digitalcopilot.app | `v=spf1 a mx ip4:[IP] ~all` | 3600 |
| TXT | _dmarc.digitalcopilot.app | `v=DMARC1; p=quarantine; rua=mailto:dmarc@digitalcopilot.app` | 3600 |
| CNAME | stalwart._domainkey.digitalcopilot.app | [Gerado pelo Stalwart] | 3600 |
| A | campaigns.digitalcopilot.app | [IP do KVM] | 3600 |
| A | webmail.digitalcopilot.app | [IP do KVM] | 3600 |
| A | crm.digitalcopilot.app | [IP do KVM] | 3600 |
| A | webhook.digitalcopilot.app | [IP do KVM] | 3600 |
| A | status.digitalcopilot.app | [IP do KVM] | 3600 |

> **rDNS / PTR Record:** O registro PTR reverso deve ser configurado pela Hostinger via suporte. Abra um ticket solicitando que o IP do servidor aponte para mail.digitalcopilot.app. Sem isso, Gmail e Outlook podem rejeitar seus emails.

---

## 3. Servidor de Email (Stalwart Mail)

### 3.1 Visao Geral

O Stalwart Mail e um servidor de email all-in-one escrito em Rust que cobre SMTP, IMAP, POP3 e JMAP em um unico binario. Inclui antispam embutido, DKIM/SPF/DMARC/ARC automatico, painel admin web e TLS automatico. O Privacy Guides usa Stalwart para seu email interno. O projeto se declarou feature-complete em 2025.

### 3.2 Funcionalidades Multi-Dominio

- Cadastro de multiplos dominios via painel admin ou API REST
- DKIM keys geradas automaticamente por dominio
- Contas de email independentes por projeto (ex: contato@projeto1.com, suporte@projeto2.com)
- Aliases e catch-all por dominio
- Cotas de armazenamento por conta
- Autenticacao OAuth2 ou Basic Auth na API de gerenciamento

### 3.3 Contas Planejadas (Inicial)

| Dominio | Conta | Uso |
|---|---|---|
| digitalcopilot.app | nathan@digitalcopilot.app | Email principal / admin |
| digitalcopilot.app | contato@digitalcopilot.app | Recepcao geral |
| digitalcopilot.app | noreply@digitalcopilot.app | Envio de campanhas (Listmonk) |
| [projeto2.com] | contato@projeto2.com | Recepcao do projeto 2 |
| [projeto3.com] | contato@projeto3.com | Recepcao do projeto 3 |

Novos dominios e contas podem ser adicionados a qualquer momento via painel admin do Stalwart ou API REST.

---

## 4. Cliente de Email (SnappyMail)

### 4.1 Por que SnappyMail

O SnappyMail e um cliente de webmail open-source moderno, leve e rapido. E um fork ativamente mantido do RainLoop, com interface limpa e responsiva. Comparado ao Roundcube (interface datada) e ao Cypht (mais experimental), o SnappyMail oferece o melhor equilibrio entre visual moderno e estabilidade.

### 4.2 Comparativo

| Cliente | Visual | Performance | Multi-conta | Limitacao |
|---|---|---|---|---|
| **SnappyMail** | Moderno, limpo | Muito rapido | Sim (identidades) | Sem filtros Sieve nativos |
| Roundcube | Datado (Elastic ajuda) | Bom | Sim (identidades + plugins) | Interface pesada |
| Cypht | Moderno, agregador | Leve | Sim (inbox unificada) | Projeto menor, menos estavel |

### 4.3 Configuracao

- Acesso via: webmail.digitalcopilot.app (HTTPS via Caddy)
- Conexao IMAP: stalwart:993 (rede interna Docker, TLS)
- Conexao SMTP: stalwart:587 (rede interna Docker, STARTTLS)
- Multiplas identidades configuradas por usuario para enviar de qualquer dominio
- Interface moderna, leve e rapida
- Suporte a temas e personalizacao visual

---

## 5. Plataforma de Campanhas (Listmonk)

### 5.1 Funcionalidades

- Gerenciamento de listas com single e double opt-in
- Segmentacao avancada via expressoes SQL
- Agendamento de campanhas com data e hora especificos
- Templates em HTML, Markdown e editor WYSIWYG
- Tracking de aberturas e cliques com analytics integrado
- API REST completa para integracao com sistemas externos
- Filas de envio multi-thread com rate limiting configuravel
- Webhooks para eventos (bounce, unsubscribe, complaint)

### 5.2 Organizacao Multi-Projeto

O Listmonk nao tem conceito de multi-tenant, mas a organizacao por projeto e feita via listas separadas. Cada projeto tera suas proprias listas (ex: Projeto A - Newsletter, Projeto A - Onboarding) e templates dedicados. O envio pode ser feito com diferentes identidades SMTP configuradas no Listmonk, uma por dominio.

### 5.3 Conexao com Stalwart

- SMTP Host: stalwart (nome do container na rede Docker)
- Porta: 587 (STARTTLS)
- Autenticacao: conta dedicada noreply@digitalcopilot.app
- Rate Limit inicial: 5 emails/minuto (limite Hostinger, solicitar aumento gradual)
- Configurar bounce handling via Stalwart webhooks

---

## 6. CRM & WhatsApp (Chatwoot)

### 6.1 Por que Chatwoot

O Chatwoot e uma plataforma open-source de atendimento omnichannel e CRM. Ele substitui ferramentas como Intercom, Zendesk e HubSpot CRM. O diferencial para seu caso e a integracao nativa com WhatsApp Business API, permitindo envio automatizado de templates de mensagem por evento.

### 6.2 Funcionalidades Relevantes

- **CRM completo:** Perfil de contato com historico de interacoes, notas, tags e atributos customizados
- **WhatsApp Business API:** Canal nativo com suporte a templates, mensagens interativas e midia
- **Inbox unificada:** Email, WhatsApp, Instagram, Facebook Messenger, web chat — tudo em um painel
- **Automacoes nativas:** Regras de automacao baseadas em eventos (novo contato, mensagem recebida, atributo alterado)
- **API REST completa:** Criar/atualizar contatos, enviar mensagens, gerenciar conversas via API
- **Webhooks:** Dispara notificacoes para eventos internos (nova conversa, mensagem, status alterado)
- **Labels & Segments:** Organizar contatos por projeto, produto, status no funil

### 6.3 Integracao com WhatsApp Business API

O Chatwoot se conecta ao WhatsApp via:

1. **WhatsApp Cloud API (Meta):** Integracao oficial via Meta Business Suite. Gratuito para receber mensagens; pago por template enviado (~$0.05-0.08 por mensagem no Brasil). Requer numero de telefone verificado e Business Manager aprovado.
2. **Provedores intermediarios (ex: 360dialog, WAHA):** Para mais flexibilidade. O WAHA (WhatsApp HTTP API) e open-source e pode rodar self-hosted, mas viola os ToS da Meta.

**Recomendacao:** WhatsApp Cloud API oficial, integrado diretamente ao Chatwoot via Embedded Signup.

### 6.4 Automacoes por Evento Hotmart

O dc-bridge recebe o webhook da Hotmart e, alem de salvar no DB e enviar para Meta CAPI, tambem atualiza o contato no Chatwoot e dispara mensagens via WhatsApp:

| Evento Hotmart | Acao no Chatwoot | Mensagem WhatsApp |
|---|---|---|
| **PURCHASE_APPROVED** | Criar/atualizar contato, label "cliente", atributo "produto: X" | Template: "Parabens pela compra! Acesse seu produto aqui: [link]" |
| **PURCHASE_REFUNDED** | Atualizar label "refund", remover "cliente" | Template: "Sentimos muito. Como podemos ajudar?" |
| **PURCHASE_CANCELED** | Atualizar label "cancelado" | Nenhuma (ou template de reengajamento apos 7 dias) |
| **CART_ABANDONMENT** | Criar contato com label "carrinho_abandonado" | **Template apos 20min:** "Voce esqueceu algo! Finalize sua compra com desconto: [link]" |
| **SUBSCRIPTION_CANCELLATION** | Atualizar label "ex-assinante" | Template: "Sentimos sua falta. Que tal voltar com 30% OFF?" |

### 6.5 Fluxo de Abandono de Carrinho (Detalhado)

Este e o fluxo mais valioso para recuperacao de vendas:

1. Usuario inicia checkout na Hotmart mas nao finaliza
2. Hotmart dispara webhook `CART_ABANDONMENT` para `webhook.digitalcopilot.app/hotmart`
3. dc-bridge recebe, extrai email + telefone + produto
4. dc-bridge salva no PostgreSQL (tabela `leads` com `source: cart_abandonment`)
5. dc-bridge agenda envio de WhatsApp para **20 minutos depois** (tabela `scheduled_messages`)
6. Cron interno do dc-bridge verifica a cada minuto se ha mensagens agendadas
7. Quando chega a hora, dc-bridge chama a API do Chatwoot para enviar template WhatsApp
8. Se o usuario comprar antes dos 20min, o dc-bridge cancela a mensagem agendada (evento `PURCHASE_APPROVED` recebido)
9. Log de tudo no PostgreSQL para auditoria e otimizacao

> **Importante:** Templates de WhatsApp precisam ser pre-aprovados pela Meta. Crie os templates no Meta Business Suite e referencie-os pelo nome na API do Chatwoot.

### 6.6 Requisitos do Chatwoot

- **RAM minima:** 2-4 GB (Ruby on Rails + Sidekiq workers)
- **Dependencias:** PostgreSQL (compartilhado) + Redis (container dedicado)
- **Docker:** Imagem oficial `chatwoot/chatwoot` com docker-compose pronto
- **WhatsApp:** Numero de telefone verificado + Meta Business Manager aprovado

> **Impacto na RAM:** O Chatwoot e o servico mais pesado da stack (~1.5-2GB). Com ele, o consumo total sobe para ~4-5GB dos 8GB disponiveis. Ainda ha margem, mas e importante otimizar: limitar Sidekiq workers a 2, configurar Redis com maxmemory 256MB, e usar PostgreSQL compartilhado.

---

## 7. Tracking Avancado & Meta Conversions API

### 7.1 Por que Tracking Server-Side em 2026

O tracking client-side (Meta Pixel sozinho) captura hoje apenas 40-60% das conversoes reais devido a bloqueadores de anuncios, restricoes do iOS (ATT), e consentimento de cookies. A Meta Conversions API (CAPI) envia dados servidor-a-servidor, contornando essas limitacoes. A Meta recomenda implementacao dual: Pixel + CAPI com deduplicacao de eventos.

> **Impacto comprovado:** Marcas usando sGTM com Meta CAPI reportam 12-15% menor CPA porque os algoritmos de ML da Meta recebem 95% dos dados de conversao (vs 60% client-side), aprendem mais rapido e otimizam lances com mais precisao.

### 7.2 Arquitetura de Tracking

A solucao combina duas camadas:

**Camada 1: Tracking Web (Stape.io + sGTM)**

1. O usuario visita sua pagina WordPress
2. O GTM Web envia eventos para o container sGTM no Stape.io (first-party domain)
3. O sGTM processa, enriquece e deduplica os eventos
4. O sGTM envia para a Meta Conversions API com Event Match Quality otimizado
5. Custom Loader do Stape contorna adblockers; Cookie Keeper mantem atribuicao 90+ dias

**Camada 2: Conversoes Hotmart (dc-bridge)**

1. Compra aprovada na Hotmart dispara webhook para webhook.digitalcopilot.app/hotmart
2. dc-bridge recebe o payload, valida o HMAC secret da Hotmart
3. Extrai e normaliza dados do comprador (email lowercase, telefone E.164)
4. Salva no PostgreSQL (tabelas leads + conversions)
5. Gera SHA256 hash dos dados PII conforme specs Meta
6. Envia evento Purchase para a Meta Conversions API via HTTP POST
7. Atualiza contato no Chatwoot + envia WhatsApp template
8. Adiciona subscriber na lista pos-venda do Listmonk

### 7.3 Meta CAPI Gateway vs sGTM

| Criterio | CAPI Gateway | sGTM (Stape.io) |
|---|---|---|
| Complexidade | Baixa (no-code) | Media (requer config GTM) |
| Flexibilidade | Apenas Meta | Multi-plataforma (Google, TikTok, etc.) |
| Enriquecimento de dados | Limitado | Total (merge com dados do servidor) |
| Anti-adblocker | Nao | Sim (Custom Loader) |
| Cookie Keeper | Nao | Sim (atribuicao 90+ dias) |
| Custo | $10-400/mes | $20-50/mes |
| **Veredicto** | Bom para inicio rapido | **Recomendado para seu caso** |

### 7.4 Configuracao no WordPress

Cada site WordPress com paginas de vendas precisa de:

- Plugin GTM4WP ou Google Tag Manager for WordPress para injecao do container GTM Web
- Container GTM Web configurado com: tag do Meta Pixel (client-side) + tag de envio para sGTM
- Eventos configurados: PageView, ViewContent, InitiateCheckout, Lead, Purchase (se checkout no WP)
- DataLayer enriquecido com dados do usuario logado (email hashed, user_id) quando disponivel
- Consent Mode v2 implementado para compliance com LGPD

### 7.5 Event Match Quality (EMQ)

Quanto mais parametros de matching voce enviar, maior o EMQ score e melhor a atribuicao:

| Parametro | Fonte | Obrigatorio | Impacto no EMQ |
|---|---|---|---|
| em (email hashed) | Hotmart webhook / formulario | Sim | Alto |
| ph (telefone hashed) | Hotmart webhook / formulario | Sim | Alto |
| fn (primeiro nome) | Hotmart webhook | Recomendado | Medio |
| ln (sobrenome) | Hotmart webhook | Recomendado | Medio |
| country | Hotmart webhook | Recomendado | Medio |
| fbc (click ID) | Cookie _fbc | Automatico via sGTM | Muito Alto |
| fbp (browser ID) | Cookie _fbp | Automatico via sGTM | Alto |
| client_ip_address | Request header | Automatico via sGTM | Alto |
| client_user_agent | Request header | Automatico via sGTM | Alto |

---

## 8. Integracao Hotmart (dc-bridge)

### 8.1 O que e o dc-bridge

O dc-bridge e um microservico Node.js leve (~50MB RAM) que centraliza toda a integracao Hotmart -> PostgreSQL -> Meta CAPI -> Chatwoot -> Listmonk. Roda como container Docker dedicado e expoe endpoints webhook protegidos por HMAC secret.

### 8.2 Funcionalidades

| Funcionalidade | Detalhes |
|---|---|
| Webhook receiver | Endpoint POST /hotmart com validacao HMAC |
| Processamento de dados | Normalizacao de email, telefone (E.164), separacao de nome |
| Persistencia | INSERT/UPSERT no PostgreSQL (leads, conversions) |
| Meta CAPI | Hash SHA256 de PII + envio para Facebook Graph API |
| Chatwoot sync | Criar/atualizar contato + disparar WhatsApp templates via API |
| Listmonk sync | Adiciona subscriber via API do Listmonk |
| Agendamento | Mensagens WhatsApp com delay (ex: 20min apos abandono) |
| Retry queue | Tabela PostgreSQL para eventos falhados + cron de retry |
| Health endpoint | GET /health para monitoramento via Uptime Kuma |
| Logs estruturados | JSON logs para debugging e auditoria |

### 8.3 Fluxo de Eventos Hotmart

| Evento Hotmart | Acao no dc-bridge | Meta CAPI | Chatwoot | Listmonk |
|---|---|---|---|---|
| PURCHASE_APPROVED | Salvar lead | Purchase | Criar contato + WA template | Adicionar na lista |
| PURCHASE_COMPLETE | Atualizar status | Purchase (se nao enviado) | Atualizar label | — |
| PURCHASE_REFUNDED | Marcar refund | Nao enviar | Label "refund" + WA | Remover da lista |
| PURCHASE_CANCELED | Marcar cancelamento | Nao enviar | Label "cancelado" | — |
| CART_ABANDONMENT | Salvar lead + agendar WA | Nao enviar | Label "carrinho" + WA (20min) | — |
| SUBSCRIPTION_CANCELLATION | Atualizar assinatura | Nao enviar | Label "ex-assinante" + WA | — |

### 8.4 Dados do Webhook Hotmart

O payload do webhook inclui:

- Dados do comprador: nome, email, telefone, documento, endereco
- Dados da transacao: ID, valor, moeda, metodo de pagamento, status
- Dados do produto: ID, nome, oferta
- Dados da assinatura (se recorrente): plano, proximo pagamento, status
- Parametros UTM originais da compra (src, sck) para atribuicao

### 8.5 Banco de Dados de Leads (PostgreSQL)

Schema dedicado para leads, conversoes e automacoes:

| Tabela | Campos Principais | Finalidade |
|---|---|---|
| leads | id, email, phone, name, source, chatwoot_contact_id, created_at | Base unificada de leads |
| conversions | id, lead_id, product, amount, status, hotmart_tx_id, sent_to_meta | Historico de compras |
| meta_events | id, conversion_id, event_name, event_id, response_code, sent_at | Log de eventos enviados a Meta |
| scheduled_messages | id, lead_id, channel, template, scheduled_for, sent, canceled | Fila de mensagens agendadas (WA) |
| retry_queue | id, payload, attempts, next_retry, error, created_at | Fila de retry para eventos falhados |
| subscriptions | id, lead_id, plan, status, next_billing, canceled_at | Gestao de assinaturas |

> **Deduplicacao de Eventos:** O event_id enviado para a Meta deve ser unico por conversao. Para compras Hotmart, use o `hotmart_transaction_id` como `event_id`. Se o usuario tambem completar a compra com o Pixel ativo na thank-you page, a Meta deduplica automaticamente.

---

## 9. Seguranca e Boas Praticas

### 9.1 Autenticacao e Acesso

- Todos os paineis web protegidos por HTTPS via Caddy
- Senhas fortes e unicas, armazenadas em Docker secrets (nao em docker-compose.yml)
- dc-bridge: webhook secret (HMAC) para validar origem das chamadas Hotmart
- Chatwoot: autenticacao SSO ou email/senha com 2FA
- Stalwart: autenticacao OAuth2 ou LDAP
- Firewall (ufw): apenas portas 22 (SSH), 25, 80, 443, 465, 587, 993 abertas
- Fail2ban configurado para proteger SSH e servicos de email contra brute force
- Atualizacoes automaticas do SO via unattended-upgrades

### 9.2 Backup e Recuperacao

| Componente | Estrategia | Frequencia | Retencao |
|---|---|---|---|
| PostgreSQL | pg_dump automatizado para storage externo | Diario | 30 dias |
| Stalwart (emails) | Backup do volume Docker /opt/stalwart | Diario | 14 dias |
| Redis (Chatwoot) | RDB snapshot | Diario | 7 dias |
| Docker Compose + dc-bridge | Versionado em repositorio Git privado | A cada mudanca | Ilimitado |
| Certificados SSL | Caddy renova automaticamente | Automatico | N/A |

### 9.3 Entregabilidade de Email (Warm-up)

A reputacao do IP e fundamental. Plano de warm-up:

1. **Semana 1:** Maximo 50 emails/dia. Enviar apenas para listas engajadas
2. **Semana 2:** Maximo 200 emails/dia. Monitorar taxa de bounce e spam reports
3. **Semana 3:** Maximo 500 emails/dia. Verificar reputacao no Google Postmaster Tools
4. **Semana 4+:** Aumentar gradualmente. Solicitar aumento de limite a Hostinger

Ferramentas de monitoramento: MXToolbox (blacklist check), Google Postmaster Tools (reputacao Gmail), Microsoft SNDS (reputacao Outlook), mail-tester.com (score de envio).

---

## 10. Plano de Entrega

### FASE 1 — Infraestrutura Base (Semana 1-2)

| Tarefa | Detalhes | Criterio de Aceite |
|---|---|---|
| Provisionar KVM 2 | Contratar plano na Hostinger, Ubuntu 22.04 LTS | SSH acessivel, IP fixo atribuido |
| Setup inicial do servidor | Docker, Docker Compose, ufw, fail2ban, swap | Docker rodando, firewall ativo |
| Configurar DNS | Registros A, MX, SPF, DKIM, DMARC | Todos os registros propagados e validados |
| Solicitar rDNS/PTR | Ticket na Hostinger para PTR -> mail.digitalcopilot.app | PTR confirmado via dig -x |
| Deploy Stalwart Mail | Docker container + volume + config inicial | SMTP/IMAP funcionais, admin acessivel |
| Deploy PostgreSQL 15 | Container + volume + databases criados | Conexao funcional |
| Deploy Redis | Container para Chatwoot | Redis respondendo |
| Deploy Caddy | Proxy reverso com SSL automatico | HTTPS em todos os subdominios |

### FASE 2 — Email & Campanhas (Semana 3)

| Tarefa | Detalhes | Criterio de Aceite |
|---|---|---|
| Deploy Listmonk | Container + config SMTP para Stalwart | Envio de teste bem-sucedido |
| Deploy SnappyMail | Container + IMAP/SMTP para Stalwart | Login e envio/recepcao OK |
| Criar contas de email | Contas iniciais no Stalwart por projeto | Todas acessiveis via SnappyMail |
| Configurar dominios adicionais | DNS + Stalwart config por projeto | Envio/recepcao funcional por dominio |
| Inicio do warm-up | Primeiros envios controlados | Taxa de entrega > 95% |

### FASE 3 — CRM & WhatsApp (Semana 4)

| Tarefa | Detalhes | Criterio de Aceite |
|---|---|---|
| Deploy Chatwoot | Container + PostgreSQL + Redis | Painel acessivel, login OK |
| Configurar WhatsApp Cloud API | Meta Business Suite + numero verificado | Canal WhatsApp ativo no Chatwoot |
| Criar templates WhatsApp | Templates para compra, abandono, refund, etc. | Templates aprovados pela Meta |
| Configurar inbox de email | Conectar Stalwart como canal de email no Chatwoot | Emails entrando no Chatwoot |
| Testar automacoes nativas | Regras de automacao por label/atributo | Automacoes disparando corretamente |

### FASE 4 — Tracking & Integracoes (Semana 5-6)

| Tarefa | Detalhes | Criterio de Aceite |
|---|---|---|
| Desenvolver dc-bridge | Microservico Node.js completo com todos os fluxos | Testes passando, health check OK |
| Deploy dc-bridge | Container Docker + webhook URL publica | Webhook recebendo requests |
| Configurar Stape.io | Conta + container sGTM + custom domain | Container sGTM respondendo |
| Setup GTM Web + sGTM | Tags, triggers, variaveis para Meta Pixel + CAPI | Eventos no Events Manager |
| Integrar WordPress | Plugin GTM4WP + DataLayer + Consent Mode v2 | PageView e ViewContent trackados |
| Criar schema PostgreSQL | Tabelas leads, conversions, meta_events, scheduled_messages, retry_queue | Migrations executadas |
| Testar fluxo completo | Hotmart -> dc-bridge -> DB -> Meta -> Chatwoot -> Listmonk | Fluxo end-to-end sem erros |

### FASE 5 — Monitoramento & Go-Live (Semana 7)

| Tarefa | Detalhes | Criterio de Aceite |
|---|---|---|
| Deploy Uptime Kuma | Monitoramento de todos os servicos | Dashboard com todos os checks verdes |
| Configurar backups | pg_dump + volumes + Redis + cron | Backup executado e restaurado com sucesso |
| Teste de abandono de carrinho | Simular abandono -> WA apos 20min -> compra cancela WA | Fluxo completo validado |
| Testes end-to-end | Compra Hotmart -> DB -> Meta -> Chatwoot -> WA -> Listmonk | Zero erros |
| Documentacao operacional | Runbook com procedimentos de manutencao | Documento entregue |
| Go-Live | Apontar trafego real | Sistema estavel por 48h em producao |

---

## 11. Estimativa de Custos Mensais

| Item | Custo Mensal (USD) | Observacao |
|---|---|---|
| Hostinger KVM 2 | $6.99 | 2 vCPU, 8GB RAM, 100GB NVMe |
| Stape.io (sGTM) | $20.00 | Plano Starter, 500k requests/mes |
| WhatsApp Cloud API | ~$5-20 | ~$0.05-0.08 por template enviado (volume depende) |
| Dominio digitalcopilot.app | ~$1.00 | Custo anual rateado |
| Stalwart Mail | Gratuito | Open source (AGPL-3.0) |
| Listmonk | Gratuito | Open source (AGPL-3.0) |
| PostgreSQL | Gratuito | Open source |
| Chatwoot | Gratuito | Open source (self-hosted) |
| dc-bridge | Gratuito | Codigo proprio |
| SnappyMail | Gratuito | Open source (AGPL-3.0) |
| Uptime Kuma | Gratuito | Open source (MIT) |
| **TOTAL** | **~$33-48/mes** | **vs $300-500+/mes em SaaS equivalentes** |

> **Economia estimada:** Brevo Business ($65) + HubSpot CRM Starter ($50) + Stape ($20) + Zapier ($30) + WhatsApp via Twilio ($50+) + webmail ($5/usuario) = facilmente $250-500/mes. Esta stack self-hosted entrega funcionalidade similar por ~$40/mes.

---

## 12. Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
|---|---|---|---|
| IP do KVM em blacklist | Alto | Media | Verificar IP antes de contratar; warm-up gradual; monitorar MXToolbox |
| Hostinger bloqueia porta 25 | Alto | Baixa | Confirmar com suporte antes; fallback para relay externo |
| Limite de 5 emails/min | Medio | Alta | Solicitar aumento gradual; respeitar warm-up; rate limiting no Listmonk |
| RAM insuficiente com Chatwoot | Medio | Media | Limitar Sidekiq workers; otimizar PostgreSQL shared_buffers; monitorar Docker stats |
| Meta rejeita templates WhatsApp | Medio | Media | Seguir guidelines da Meta; nao usar linguagem promocional excessiva |
| Meta rejeita eventos CAPI | Medio | Media | Validar payload no Events Manager; monitorar EMQ; logs no dc-bridge |
| Webhook Hotmart falha | Medio | Baixa | Retry queue no PostgreSQL; alerta imediato; logs persistidos |
| Disco cheio | Alto | Baixa | Monitoramento de disco; rotacao de logs; limpeza de emails antigos |
| Queda do servidor | Alto | Baixa | Uptime Kuma + alertas; backups diarios; runbook de recuperacao |

---

## 13. Metricas de Sucesso

| Metrica | Meta | Como Medir |
|---|---|---|
| Taxa de entrega de email | > 95% | Stalwart logs + bounce rate no Listmonk |
| Event Match Quality (Meta) | > 7.0 (de 10) | Meta Events Manager > EMQ score |
| Conversoes capturadas vs reais | > 90% | Comparar eventos Meta vs vendas Hotmart |
| Taxa de recuperacao de carrinho | > 5% | Carrinhos abandonados com compra apos WA / total abandonos |
| Uptime dos servicos | > 99.5% | Uptime Kuma dashboard |
| Tempo de envio de campanhas | < 5 min para 1000 emails | Logs do Listmonk |
| Latencia webhook Hotmart -> Meta | < 30 segundos | Timestamps no dc-bridge logs |
| Uso de RAM total | < 6GB | Docker stats / Uptime Kuma |

---

## 14. Consumo Estimado de Recursos (RAM)

| Container | RAM Estimada | Observacao |
|---|---|---|
| Stalwart Mail | 200-400 MB | Depende do volume de emails armazenados |
| PostgreSQL 15 | 300-500 MB | Compartilhado: Listmonk + Chatwoot + leads |
| Chatwoot (web + sidekiq) | 1500-2000 MB | Servico mais pesado; limitar sidekiq workers a 2 |
| Redis | 100-256 MB | Cache do Chatwoot; configurar maxmemory |
| Listmonk | 100-200 MB | Go binary, muito eficiente |
| SnappyMail | 50-100 MB | PHP-FPM, leve |
| dc-bridge | 30-50 MB | Node.js minimal |
| Caddy | 30-50 MB | Proxy reverso eficiente |
| Uptime Kuma | 100-150 MB | Node.js com SQLite |
| Sistema Operacional | 300-500 MB | Ubuntu 22.04 minimal |
| **TOTAL ESTIMADO** | **2.7 - 4.2 GB** | **Sobra 4-5 GB livres dos 8 GB disponiveis** |

> **Nota sobre o KVM 4 ($9.99/mes):** Se o Chatwoot crescer em uso (muitas conversas simultaneas, muitos agentes), considere migrar para o KVM 4 (4 vCPU, 16GB RAM). Mas para inicio, o KVM 2 e suficiente.

---

*PRD v3.0 | Digital Copilot | Marco 2026*