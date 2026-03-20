# PRD: Meta Ads MCP Server

## Introduction

Criar um servidor MCP (Model Context Protocol) completo para gerenciamento pessoal de contas de anúncios da Meta (Facebook/Instagram Ads). O servidor expõe todas as funcionalidades da Meta Marketing API como ferramentas MCP, permitindo controle total sobre campanhas, ad sets, anúncios, criativos, audiências, relatórios, pixels, catálogos e lead forms — tudo via Claude ou qualquer cliente MCP compatível.

O servidor segue rigorosamente as políticas e guidelines da Meta para uso da Marketing API, incluindo rate limiting, validação de políticas de anúncios, compliance com dados sensíveis, audit logging e alertas de violação de políticas.

## Goals

- Expor 100% das funcionalidades da Meta Marketing API v21.0+ como ferramentas MCP
- Suportar autenticação via System User Token (fixo) e OAuth 2.0 completo
- Implementar rate limiting inteligente respeitando os limites da Meta (Business Use Case Rate Limits)
- Validar políticas de anúncios antes de submissão (texto, imagem, targeting)
- Registrar todas as operações em audit log para rastreabilidade
- Alertar sobre violações de políticas e status de review de anúncios
- Gerenciar permissões granulares por conta de anúncio
- Tratar erros da API de forma clara e acionável

## User Stories

### US-001: Setup e configuração inicial do projeto
**Description:** Como desenvolvedor, preciso configurar o projeto com a estrutura base do MCP server para que eu possa começar a implementar as ferramentas.

**Acceptance Criteria:**
- [ ] Projeto inicializado com estrutura de pastas organizada (src/, config/, tests/)
- [ ] Dependências instaladas: `@modelcontextprotocol/sdk`, `facebook-nodejs-business-sdk` (ou equivalente)
- [ ] Arquivo de configuração para credenciais da Meta (app_id, app_secret, tokens)
- [ ] Servidor MCP básico rodando e respondendo a `tools/list`
- [ ] Variáveis de ambiente documentadas em `.env.example`
- [ ] Typecheck/lint passa

### US-002: Autenticação com System User Token
**Description:** Como usuário, quero autenticar usando um System User Token fixo para que eu possa acessar a API rapidamente sem fluxo OAuth.

**Acceptance Criteria:**
- [ ] Configurar token via variável de ambiente `META_SYSTEM_USER_TOKEN`
- [ ] Validar token na inicialização do servidor (chamada a `/me`)
- [ ] Retornar erro claro se token inválido ou expirado
- [ ] Armazenar informações da conta autenticada (account_id, name)
- [ ] Typecheck/lint passa

### US-003: Autenticação OAuth 2.0 completa
**Description:** Como usuário, quero autenticar via OAuth 2.0 do Facebook para que eu tenha tokens com as permissões corretas e renovação automática.

**Acceptance Criteria:**
- [ ] Ferramenta MCP `auth_oauth_start` que retorna URL de autorização
- [ ] Callback handler para receber o authorization code
- [ ] Troca de code por access token (short-lived → long-lived)
- [ ] Renovação automática de token antes da expiração
- [ ] Armazenamento seguro do token (encrypted at rest)
- [ ] Permissões solicitadas: `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`, `leads_retrieval`, `catalog_management`
- [ ] Typecheck/lint passa

### US-004: Listar e selecionar contas de anúncios
**Description:** Como usuário, quero listar todas as minhas contas de anúncios e selecionar a conta ativa para operar.

**Acceptance Criteria:**
- [ ] Ferramenta `get_ad_accounts` — lista todas as contas vinculadas ao usuário
- [ ] Retorna: account_id, name, currency, timezone, status, spend_cap
- [ ] Ferramenta `set_active_account` — define conta ativa para operações subsequentes
- [ ] Validação de permissões ao selecionar conta
- [ ] Typecheck/lint passa

### US-005: CRUD completo de Campanhas
**Description:** Como usuário, quero criar, ler, atualizar e deletar campanhas para gerenciar minha estrutura de anúncios.

**Acceptance Criteria:**
- [ ] Ferramenta `get_campaigns` — lista campanhas com filtros (status, date_range)
- [ ] Ferramenta `get_campaign_details` — detalhes de uma campanha específica
- [ ] Ferramenta `create_campaign` — cria campanha com parâmetros: name, objective, status, special_ad_categories, budget (CBO), bid_strategy
- [ ] Ferramenta `update_campaign` — atualiza campos editáveis
- [ ] Ferramenta `delete_campaign` — remove campanha (com confirmação)
- [ ] Ferramenta `duplicate_campaign` — duplica campanha existente
- [ ] Validação de `special_ad_categories` obrigatório conforme políticas da Meta
- [ ] Validação de objectives válidos (OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION)
- [ ] Typecheck/lint passa

### US-006: CRUD completo de Ad Sets
**Description:** Como usuário, quero gerenciar ad sets para controlar targeting, budget e schedule dos meus anúncios.

**Acceptance Criteria:**
- [ ] Ferramenta `get_adsets` — lista ad sets de uma campanha
- [ ] Ferramenta `get_adset_details` — detalhes de um ad set
- [ ] Ferramenta `create_adset` — cria ad set com: name, campaign_id, billing_event, optimization_goal, bid_amount, daily_budget/lifetime_budget, targeting, start_time, end_time, status
- [ ] Ferramenta `update_adset` — atualiza campos editáveis
- [ ] Ferramenta `delete_adset` — remove ad set
- [ ] Ferramenta `duplicate_adset` — duplica ad set
- [ ] Validação de targeting conforme políticas (ex: idade mínima, exclusões obrigatórias para special_ad_categories)
- [ ] Typecheck/lint passa

### US-007: CRUD completo de Anúncios (Ads)
**Description:** Como usuário, quero gerenciar anúncios individuais para controlar quais criativos estão ativos.

**Acceptance Criteria:**
- [ ] Ferramenta `get_ads` — lista anúncios de um ad set
- [ ] Ferramenta `get_ad_details` — detalhes de um anúncio
- [ ] Ferramenta `create_ad` — cria anúncio vinculando ad set + criativo
- [ ] Ferramenta `update_ad` — atualiza campos (status, name, creative)
- [ ] Ferramenta `delete_ad` — remove anúncio
- [ ] Ferramenta `duplicate_ad` — duplica anúncio
- [ ] Exibir `review_feedback` e `policy_issues` quando disponíveis
- [ ] Typecheck/lint passa

### US-008: Gestão de Criativos (Ad Creatives)
**Description:** Como usuário, quero criar e gerenciar criativos de anúncios incluindo upload de mídia.

**Acceptance Criteria:**
- [ ] Ferramenta `get_ad_creatives` — lista criativos da conta
- [ ] Ferramenta `get_creative_details` — detalhes de um criativo
- [ ] Ferramenta `create_ad_creative` — cria criativo com: name, object_story_spec (link_data, video_data, photo_data), call_to_action
- [ ] Ferramenta `create_carousel_creative` — cria criativo carrossel
- [ ] Ferramenta `update_ad_creative` — atualiza criativo
- [ ] Ferramenta `upload_ad_image` — upload de imagem (path local ou URL)
- [ ] Ferramenta `upload_ad_video` — upload de vídeo (path local ou URL) com polling de status
- [ ] Ferramenta `get_ad_image` — busca imagem por hash
- [ ] Ferramenta `get_ad_video` — busca vídeo por ID com status de encoding
- [ ] Validação de texto: limite de 125 chars no primary text, 40 chars no headline, 30 chars na description (avisar quando exceder, não bloquear)
- [ ] Typecheck/lint passa

### US-009: Gestão de Audiências
**Description:** Como usuário, quero criar e gerenciar audiências customizadas e lookalike para targeting preciso.

**Acceptance Criteria:**
- [ ] Ferramenta `get_custom_audiences` — lista audiências customizadas
- [ ] Ferramenta `create_custom_audience` — cria audiência (website, customer_list, engagement, app_activity)
- [ ] Ferramenta `create_lookalike_audience` — cria lookalike a partir de audiência fonte
- [ ] Ferramenta `update_audience` — atualiza audiência
- [ ] Ferramenta `delete_audience` — remove audiência
- [ ] Ferramenta `estimate_audience_size` — estima alcance de um targeting spec
- [ ] Ferramenta `search_interests` — busca interesses para targeting
- [ ] Ferramenta `search_behaviors` — busca comportamentos para targeting
- [ ] Ferramenta `search_demographics` — busca dados demográficos
- [ ] Ferramenta `search_geo_locations` — busca localizações para targeting
- [ ] Compliance com regras de dados sensíveis (hashing de PII com SHA-256 antes de upload)
- [ ] Typecheck/lint passa

### US-010: Relatórios e Insights
**Description:** Como usuário, quero acessar relatórios de performance para analisar resultados dos anúncios.

**Acceptance Criteria:**
- [ ] Ferramenta `get_insights` — relatórios com parâmetros: level (account, campaign, adset, ad), date_range, time_increment (daily, weekly, monthly, all_days), fields, filtering, breakdowns
- [ ] Ferramenta `get_insights_async` — relatórios assíncronos para grandes volumes (cria report run, poll status, retorna resultados)
- [ ] Campos disponíveis: impressions, clicks, spend, cpc, cpm, ctr, reach, frequency, conversions, cost_per_action_type, actions, action_values, ROAS
- [ ] Breakdowns disponíveis: age, gender, country, region, placement, device_platform, publisher_platform
- [ ] Filtros por campaign_id, adset_id, ad_id, status
- [ ] Formatação clara dos resultados (tabular quando possível)
- [ ] Typecheck/lint passa

### US-011: Gestão de Pixels e Conversões
**Description:** Como usuário, quero gerenciar pixels e eventos de conversão para rastrear resultados.

**Acceptance Criteria:**
- [ ] Ferramenta `get_pixels` — lista pixels da conta
- [ ] Ferramenta `get_pixel_stats` — estatísticas do pixel (eventos recebidos, última atividade)
- [ ] Ferramenta `create_custom_conversion` — cria conversão customizada (URL rules, event rules)
- [ ] Ferramenta `get_custom_conversions` — lista conversões customizadas
- [ ] Ferramenta `get_server_events_status` — status de eventos do servidor (Conversions API)
- [ ] Typecheck/lint passa

### US-012: Gestão de Catálogos de Produtos
**Description:** Como usuário, quero gerenciar catálogos de produtos para campanhas de e-commerce.

**Acceptance Criteria:**
- [ ] Ferramenta `list_catalogs` — lista catálogos da conta
- [ ] Ferramenta `get_catalog_details` — detalhes de um catálogo
- [ ] Ferramenta `list_product_sets` — lista conjuntos de produtos
- [ ] Ferramenta `get_product_set_details` — detalhes de um conjunto
- [ ] Ferramenta `create_product_set` — cria conjunto com filtros
- [ ] Typecheck/lint passa

### US-013: Gestão de Lead Forms
**Description:** Como usuário, quero criar e gerenciar formulários de lead para campanhas de geração de leads.

**Acceptance Criteria:**
- [ ] Ferramenta `get_lead_gen_forms` — lista formulários
- [ ] Ferramenta `create_lead_gen_form` — cria formulário com: name, questions, privacy_policy_url, follow_up_action
- [ ] Ferramenta `get_leads` — recupera leads de um formulário
- [ ] Ferramenta `update_lead_gen_form_status` — ativa/desativa formulário
- [ ] Compliance com LGPD/GDPR na coleta de dados
- [ ] Typecheck/lint passa

### US-014: Rate Limiting inteligente
**Description:** Como desenvolvedor, preciso de um sistema de rate limiting que respeite os limites da Meta API para evitar bloqueios.

**Acceptance Criteria:**
- [ ] Implementar controle de rate limit baseado nos headers da Meta (`x-business-use-case-usage`, `x-app-usage`, `x-ad-account-usage`)
- [ ] Backoff exponencial automático quando atingir 75% do limite
- [ ] Pausa automática quando atingir 95% do limite
- [ ] Fila de requisições com prioridade (leitura > escrita)
- [ ] Logging de uso de rate limit para monitoramento
- [ ] Ferramenta `get_rate_limit_status` — exibe uso atual dos limites
- [ ] Typecheck/lint passa

### US-015: Validação de políticas de anúncios
**Description:** Como usuário, quero que o servidor valide meus anúncios contra as políticas da Meta antes de submeter, para reduzir rejeições.

**Acceptance Criteria:**
- [ ] Ferramenta `validate_ad_content` — valida texto e mídia antes de criar criativo
- [ ] Verificação de palavras/temas proibidos (lista configurável)
- [ ] Verificação de limites de texto (primary text, headline, description)
- [ ] Verificação de proporção texto/imagem (regra dos 20%)
- [ ] Verificação de categorias especiais (housing, credit, employment, politics)
- [ ] Verificação de targeting restrito para categorias especiais
- [ ] Retorno de warnings (não bloqueiam) e errors (bloqueiam)
- [ ] Typecheck/lint passa

### US-016: Audit logging
**Description:** Como usuário, quero que todas as operações sejam registradas em log para rastreabilidade e segurança.

**Acceptance Criteria:**
- [ ] Toda operação de escrita (create, update, delete) registrada com: timestamp, user, action, resource_type, resource_id, parameters, result
- [ ] Toda operação de leitura registrada com nível reduzido (timestamp, action, resource_type)
- [ ] Logs persistidos em arquivo rotativo (max 50MB, manter últimos 10 arquivos)
- [ ] Ferramenta `get_audit_log` — consulta logs com filtros (date_range, action_type, resource_type)
- [ ] Ferramenta `export_audit_log` — exporta logs em CSV/JSON
- [ ] Dados sensíveis (tokens, PII) nunca aparecem nos logs
- [ ] Typecheck/lint passa

### US-017: Permissões granulares por conta
**Description:** Como usuário, quero definir permissões granulares para controlar quais operações são permitidas em cada conta.

**Acceptance Criteria:**
- [ ] Arquivo de configuração de permissões por account_id
- [ ] Níveis: `read_only`, `manage_campaigns`, `manage_audiences`, `full_access`
- [ ] Verificação de permissão antes de cada operação de escrita
- [ ] Ferramenta `get_account_permissions` — exibe permissões da conta ativa
- [ ] Ferramenta `set_account_permissions` — define permissões (protegido por confirmação)
- [ ] Typecheck/lint passa

### US-018: Alertas de violações e status de review
**Description:** Como usuário, quero ser alertado sobre violações de políticas e mudanças de status nos meus anúncios.

**Acceptance Criteria:**
- [ ] Ferramenta `check_ad_review_status` — verifica status de review de anúncios pendentes
- [ ] Ferramenta `get_account_alerts` — lista alertas ativos da conta (policy violations, spending limits, payment issues)
- [ ] Ferramenta `get_rejected_ads` — lista anúncios rejeitados com motivos
- [ ] Ferramenta `request_ad_review` — solicita re-review de anúncio rejeitado
- [ ] Resumo de alertas retornado automaticamente ao selecionar conta ativa
- [ ] Typecheck/lint passa

### US-019: Busca e navegação na estrutura
**Description:** Como usuário, quero buscar e navegar pela estrutura de campanhas de forma rápida e intuitiva.

**Acceptance Criteria:**
- [ ] Ferramenta `search` — busca por nome em campanhas, ad sets e anúncios
- [ ] Ferramenta `get_account_overview` — resumo da conta (total campanhas ativas, spend total, top campaigns)
- [ ] Ferramenta `get_campaign_tree` — exibe árvore hierárquica (campaign → adsets → ads) para uma campanha
- [ ] Typecheck/lint passa

### US-020: Gestão de Budget Schedules
**Description:** Como usuário, quero gerenciar agendamentos de budget para controlar gastos ao longo do tempo.

**Acceptance Criteria:**
- [ ] Ferramenta `create_budget_schedule` — cria agendamento de budget (campaign level)
- [ ] Ferramenta `get_budget_schedules` — lista agendamentos ativos
- [ ] Ferramenta `update_budget_schedule` — atualiza agendamento
- [ ] Ferramenta `delete_budget_schedule` — remove agendamento
- [ ] Typecheck/lint passa

### US-021: Páginas do Facebook vinculadas
**Description:** Como usuário, quero acessar e selecionar páginas do Facebook para usar nos anúncios.

**Acceptance Criteria:**
- [ ] Ferramenta `get_account_pages` — lista páginas vinculadas à conta
- [ ] Ferramenta `get_instagram_accounts` — lista contas de Instagram vinculadas
- [ ] Informações retornadas: page_id, name, category, access_token status
- [ ] Typecheck/lint passa

### US-022: Tratamento de erros robusto
**Description:** Como usuário, quero mensagens de erro claras e acionáveis quando algo falhar.

**Acceptance Criteria:**
- [ ] Todos os erros da Meta API mapeados para mensagens em português
- [ ] Códigos de erro da Meta incluídos na resposta (error_code, error_subcode)
- [ ] Sugestões de ação para erros comuns (ex: "Token expirado — use auth_oauth_start para renovar")
- [ ] Retry automático para erros transientes (rate limit, timeout) — máximo 3 tentativas
- [ ] Erros nunca expõem tokens ou dados sensíveis
- [ ] Typecheck/lint passa

## Functional Requirements

- FR-1: O servidor DEVE implementar o protocolo MCP (Model Context Protocol) usando o SDK oficial `@modelcontextprotocol/sdk`
- FR-2: O servidor DEVE suportar transporte via stdio e SSE (Server-Sent Events)
- FR-3: O servidor DEVE autenticar com a Meta API usando System User Token ou OAuth 2.0
- FR-4: O servidor DEVE usar a Meta Marketing API v21.0 ou superior
- FR-5: O servidor DEVE implementar rate limiting baseado nos headers de usage da Meta
- FR-6: O servidor DEVE validar conteúdo de anúncios contra políticas conhecidas antes de submissão
- FR-7: O servidor DEVE registrar todas as operações de escrita em audit log
- FR-8: O servidor DEVE encriptar tokens armazenados localmente (AES-256 ou equivalente)
- FR-9: O servidor DEVE fazer hash SHA-256 de qualquer PII antes de enviar à Meta (audiências de customer_list)
- FR-10: O servidor DEVE retornar erros estruturados com códigos da Meta e mensagens acionáveis
- FR-11: O servidor DEVE suportar paginação automática para listagens grandes (cursor-based pagination)
- FR-12: O servidor DEVE respeitar as `special_ad_categories` em todas as operações de criação de campanha
- FR-13: O servidor DEVE impedir operações de escrita em contas configuradas como `read_only`
- FR-14: O servidor DEVE expor uma ferramenta `get_rate_limit_status` para verificar uso dos limites
- FR-15: O servidor DEVE suportar relatórios assíncronos para queries grandes (async report runs)
- FR-16: O servidor DEVE persistir logs em arquivos rotativos (max 50MB, 10 arquivos)
- FR-17: O servidor DEVE mascarar dados sensíveis em todos os logs e respostas de erro

## Non-Goals

- **Não** será uma interface web/UI — é exclusivamente um servidor MCP para uso via CLI/Claude
- **Não** gerenciará Business Manager ou configurações organizacionais (foco em ad accounts)
- **Não** fará automação de regras (ex: pausar campanha se CPA > X) — apenas operações sob demanda
- **Não** integrará com outras plataformas de anúncios (Google Ads, TikTok Ads, etc.)
- **Não** armazenará dados de leads ou audiências em banco de dados próprio — apenas repassa da API
- **Não** fará web scraping ou qualquer operação que viole os Termos de Serviço da Meta
- **Não** implementará webhooks para notificações em tempo real (polling manual via ferramentas)

## Technical Considerations

- **Meta Marketing API v21.0+** — usar a versão mais recente estável
- **MCP SDK** — `@modelcontextprotocol/sdk` para TypeScript ou `mcp` para Python (a ser definido na implementação)
- **Facebook Business SDK** — `facebook-nodejs-business-sdk` (TS) ou `facebook-business` (Python) para interação com a API
- **Rate Limiting** — A Meta usa Business Use Case Rate Limits; cada ad account tem bucket separado. Headers relevantes: `x-business-use-case-usage`, `x-app-usage`, `x-ad-account-usage`
- **Token Management** — Long-lived tokens duram ~60 dias; System User tokens não expiram mas podem ser revogados
- **Paginação** — A Meta usa cursor-based pagination; implementar auto-pagination com limite configurável
- **Tamanho de resposta** — Limitar campos retornados por padrão; permitir expansão via parâmetro `fields`
- **Configuração** — Usar arquivo `.env` para credenciais e `config.json` para permissões e preferências
- **Estrutura do projeto sugerida:**
  ```
  src/
  ├── index.ts              # Entry point do MCP server
  ├── server.ts             # Configuração do servidor MCP
  ├── auth/                 # Autenticação (OAuth, System User)
  ├── tools/                # Ferramentas MCP organizadas por domínio
  │   ├── campaigns.ts
  │   ├── adsets.ts
  │   ├── ads.ts
  │   ├── creatives.ts
  │   ├── audiences.ts
  │   ├── insights.ts
  │   ├── pixels.ts
  │   ├── catalogs.ts
  │   ├── lead-forms.ts
  │   ├── pages.ts
  │   ├── budget.ts
  │   ├── search.ts
  │   └── admin.ts          # rate limits, audit, permissions
  ├── validators/           # Validação de políticas
  ├── rate-limiter/          # Rate limiting inteligente
  ├── audit/                # Audit logging
  ├── permissions/          # Permissões granulares
  ├── errors/               # Error handling e mapeamento
  └── utils/                # Utilitários (encryption, hashing, pagination)
  ```

## Success Metrics

- Todas as operações CRUD de campanhas, ad sets, ads e criativos funcionam corretamente via MCP
- Zero tokens ou PII expostos em logs ou mensagens de erro
- Rate limiting previne 100% dos erros 429 (throttling) da Meta API
- Validação de políticas reduz taxa de rejeição de anúncios em pelo menos 50%
- Audit log registra 100% das operações de escrita com dados suficientes para auditoria
- Tempo de resposta médio < 3s para operações de leitura e < 5s para operações de escrita
- Servidor inicia e lista ferramentas em < 2s

## Open Questions

- Qual idioma preferido para mensagens de erro e documentação? (Português BR vs Inglês)
- Deseja suporte a múltiplos idiomas nas mensagens?
- A configuração de permissões granulares deve ser por perfil (ex: "perfil_agencia", "perfil_readonly") ou diretamente por account_id?
- Deseja integração com algum sistema de notificação externo (email, Telegram) para alertas críticos, ou apenas via MCP tools?
- Há necessidade de suportar a Conversions API (CAPI) para envio de eventos server-side, ou apenas leitura de status?
