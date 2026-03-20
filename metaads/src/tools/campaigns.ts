import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

const VALID_OBJECTIVES = [
  'OUTCOME_AWARENESS',
  'OUTCOME_ENGAGEMENT',
  'OUTCOME_LEADS',
  'OUTCOME_SALES',
  'OUTCOME_TRAFFIC',
  'OUTCOME_APP_PROMOTION',
];

const CAMPAIGN_FIELDS =
  'id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,bid_strategy,special_ad_categories,created_time,updated_time,start_time,stop_time';

export const campaignTools: Tool[] = [
  {
    name: 'get_campaigns',
    description: 'Lista campanhas da conta ativa com filtros opcionais',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filtrar por status: ACTIVE, PAUSED, DELETED, ARCHIVED',
          enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'],
        },
        limit: {
          type: 'number',
          description: 'Limite de resultados (padrão: 25)',
        },
      },
    },
  },
  {
    name: 'get_campaign_details',
    description: 'Retorna detalhes completos de uma campanha específica',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'string',
          description: 'ID da campanha',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'create_campaign',
    description: 'Cria uma nova campanha na conta ativa',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da campanha' },
        objective: {
          type: 'string',
          description: 'Objetivo da campanha',
          enum: VALID_OBJECTIVES,
        },
        status: {
          type: 'string',
          description: 'Status inicial (padrão: PAUSED)',
          enum: ['ACTIVE', 'PAUSED'],
        },
        special_ad_categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categorias especiais: NONE, HOUSING, CREDIT, EMPLOYMENT, ISSUES_ELECTIONS_POLITICS',
        },
        daily_budget: {
          type: 'number',
          description: 'Orçamento diário em centavos (CBO)',
        },
        lifetime_budget: {
          type: 'number',
          description: 'Orçamento vitalício em centavos (CBO)',
        },
        bid_strategy: {
          type: 'string',
          description: 'Estratégia de lance',
          enum: ['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP'],
        },
      },
      required: ['name', 'objective', 'special_ad_categories'],
    },
  },
  {
    name: 'update_campaign',
    description: 'Atualiza campos de uma campanha existente',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        name: { type: 'string', description: 'Novo nome' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] },
        daily_budget: { type: 'number', description: 'Orçamento diário em centavos' },
        lifetime_budget: { type: 'number', description: 'Orçamento vitalício em centavos' },
        bid_strategy: { type: 'string', enum: ['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP'] },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'delete_campaign',
    description: 'Remove uma campanha (requer confirmação)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        confirm: { type: 'boolean', description: 'Deve ser true para confirmar a exclusão' },
      },
      required: ['campaign_id', 'confirm'],
    },
  },
  {
    name: 'duplicate_campaign',
    description: 'Duplica uma campanha existente',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha a duplicar' },
        new_name: { type: 'string', description: 'Nome da cópia (opcional)' },
      },
      required: ['campaign_id'],
    },
  },
];

export async function handleCampaignTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'get_campaigns': {
      const params: Record<string, unknown> = {
        fields: CAMPAIGN_FIELDS,
        limit: args.limit ?? 25,
      };
      if (args.status) {
        params.filtering = JSON.stringify([
          { field: 'effective_status', operator: 'IN', value: [args.status] },
        ]);
      }
      const campaigns = await metaPaginatedRequest({
        path: `/${accountId}/campaigns`,
        params,
      });
      return JSON.stringify(campaigns, null, 2);
    }

    case 'get_campaign_details': {
      const result = await metaRequest({
        path: `/${args.campaign_id}`,
        params: { fields: CAMPAIGN_FIELDS },
      });
      return JSON.stringify(result, null, 2);
    }

    case 'create_campaign': {
      if (!args.objective || !VALID_OBJECTIVES.includes(args.objective as string)) {
        throw new Error(
          `Objetivo inválido. Valores aceitos: ${VALID_OBJECTIVES.join(', ')}`
        );
      }

      const params: Record<string, unknown> = {
        name: args.name,
        objective: args.objective,
        status: args.status ?? 'PAUSED',
        special_ad_categories: args.special_ad_categories,
      };
      if (args.daily_budget) params.daily_budget = args.daily_budget;
      if (args.lifetime_budget) params.lifetime_budget = args.lifetime_budget;
      if (args.bid_strategy) params.bid_strategy = args.bid_strategy;

      const result = await metaRequest<{ id: string }>({
        method: 'POST',
        path: `/${accountId}/campaigns`,
        params,
      });

      return JSON.stringify(
        { message: 'Campanha criada com sucesso', campaign_id: result.id },
        null,
        2
      );
    }

    case 'update_campaign': {
      const { campaign_id, ...updates } = args;
      const params: Record<string, unknown> = {};
      if (updates.name) params.name = updates.name;
      if (updates.status) params.status = updates.status;
      if (updates.daily_budget) params.daily_budget = updates.daily_budget;
      if (updates.lifetime_budget) params.lifetime_budget = updates.lifetime_budget;
      if (updates.bid_strategy) params.bid_strategy = updates.bid_strategy;

      await metaRequest({
        method: 'POST',
        path: `/${campaign_id}`,
        params,
      });

      return JSON.stringify({ message: 'Campanha atualizada com sucesso', campaign_id }, null, 2);
    }

    case 'delete_campaign': {
      if (!args.confirm) {
        throw new Error('Defina confirm=true para confirmar a exclusão da campanha.');
      }
      await metaRequest({
        method: 'POST',
        path: `/${args.campaign_id}`,
        params: { status: 'DELETED' },
      });
      return JSON.stringify(
        { message: 'Campanha deletada com sucesso', campaign_id: args.campaign_id },
        null,
        2
      );
    }

    case 'duplicate_campaign': {
      const result = await metaRequest<{ campaign_id: string }>({
        method: 'POST',
        path: `/${args.campaign_id}/copies`,
        params: {
          ...(args.new_name ? { rename_options: JSON.stringify({ rename_suffix: ` - ${args.new_name}` }) } : {}),
        },
      });
      return JSON.stringify(
        { message: 'Campanha duplicada com sucesso', new_campaign_id: result.campaign_id },
        null,
        2
      );
    }

    default:
      throw new Error(`Unknown campaign tool: ${name}`);
  }
}
