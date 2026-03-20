import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

const ADSET_FIELDS =
  'id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,budget_remaining,start_time,end_time,targeting,optimization_goal,billing_event,bid_amount,bid_strategy,created_time,updated_time';

export const adsetTools: Tool[] = [
  {
    name: 'get_adsets',
    description: 'Lista ad sets de uma campanha ou da conta ativa',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha (opcional — se omitido, lista da conta)' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'], description: 'Filtrar por status' },
        limit: { type: 'number', description: 'Limite de resultados (padrão: 25)' },
      },
    },
  },
  {
    name: 'get_adset_details',
    description: 'Retorna detalhes completos de um ad set específico',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'create_adset',
    description: 'Cria um novo ad set em uma campanha',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do ad set' },
        campaign_id: { type: 'string', description: 'ID da campanha' },
        billing_event: { type: 'string', enum: ['IMPRESSIONS', 'LINK_CLICKS', 'POST_ENGAGEMENT'], description: 'Evento de cobrança' },
        optimization_goal: { type: 'string', description: 'Objetivo de otimização (ex: REACH, LINK_CLICKS, IMPRESSIONS, LEAD_GENERATION, CONVERSIONS)' },
        bid_amount: { type: 'number', description: 'Valor do lance em centavos (opcional)' },
        daily_budget: { type: 'number', description: 'Orçamento diário em centavos' },
        lifetime_budget: { type: 'number', description: 'Orçamento vitalício em centavos' },
        targeting: { type: 'object', description: 'Targeting spec (geo_locations, age_min, age_max, genders, interests, etc.)' },
        start_time: { type: 'string', description: 'Data/hora de início (ISO 8601)' },
        end_time: { type: 'string', description: 'Data/hora de fim (ISO 8601)' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'Status inicial (padrão: PAUSED)' },
      },
      required: ['name', 'campaign_id', 'billing_event', 'optimization_goal', 'targeting'],
    },
  },
  {
    name: 'update_adset',
    description: 'Atualiza campos de um ad set existente',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] },
        daily_budget: { type: 'number' },
        lifetime_budget: { type: 'number' },
        bid_amount: { type: 'number' },
        targeting: { type: 'object' },
        start_time: { type: 'string' },
        end_time: { type: 'string' },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'delete_adset',
    description: 'Remove um ad set (requer confirmação)',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
        confirm: { type: 'boolean', description: 'Deve ser true para confirmar' },
      },
      required: ['adset_id', 'confirm'],
    },
  },
  {
    name: 'duplicate_adset',
    description: 'Duplica um ad set existente',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set a duplicar' },
        campaign_id: { type: 'string', description: 'Campanha destino (opcional — padrão: mesma campanha)' },
      },
      required: ['adset_id'],
    },
  },
];

export async function handleAdsetTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'get_adsets': {
      const parentId = (args.campaign_id as string) || serverState.getActiveAccountId();
      const params: Record<string, unknown> = { fields: ADSET_FIELDS, limit: args.limit ?? 25 };
      if (args.status) {
        params.filtering = JSON.stringify([{ field: 'effective_status', operator: 'IN', value: [args.status] }]);
      }
      const adsets = await metaPaginatedRequest({ path: `/${parentId}/adsets`, params });
      return JSON.stringify(adsets, null, 2);
    }

    case 'get_adset_details': {
      const result = await metaRequest({ path: `/${args.adset_id}`, params: { fields: ADSET_FIELDS } });
      return JSON.stringify(result, null, 2);
    }

    case 'create_adset': {
      const accountId = serverState.getActiveAccountId();
      const params: Record<string, unknown> = {
        name: args.name,
        campaign_id: args.campaign_id,
        billing_event: args.billing_event,
        optimization_goal: args.optimization_goal,
        targeting: args.targeting,
        status: args.status ?? 'PAUSED',
      };
      if (args.bid_amount) params.bid_amount = args.bid_amount;
      if (args.daily_budget) params.daily_budget = args.daily_budget;
      if (args.lifetime_budget) params.lifetime_budget = args.lifetime_budget;
      if (args.start_time) params.start_time = args.start_time;
      if (args.end_time) params.end_time = args.end_time;

      const result = await metaRequest<{ id: string }>({ method: 'POST', path: `/${accountId}/adsets`, params });
      return JSON.stringify({ message: 'Ad set criado com sucesso', adset_id: result.id }, null, 2);
    }

    case 'update_adset': {
      const { adset_id, ...updates } = args;
      const params: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) params[key] = val;
      }
      await metaRequest({ method: 'POST', path: `/${adset_id}`, params });
      return JSON.stringify({ message: 'Ad set atualizado com sucesso', adset_id }, null, 2);
    }

    case 'delete_adset': {
      if (!args.confirm) throw new Error('Defina confirm=true para confirmar a exclusão.');
      await metaRequest({ method: 'POST', path: `/${args.adset_id}`, params: { status: 'DELETED' } });
      return JSON.stringify({ message: 'Ad set deletado com sucesso', adset_id: args.adset_id }, null, 2);
    }

    case 'duplicate_adset': {
      const params: Record<string, unknown> = {};
      if (args.campaign_id) params.campaign_id = args.campaign_id;
      const result = await metaRequest<{ ad_set_id: string }>({ method: 'POST', path: `/${args.adset_id}/copies`, params });
      return JSON.stringify({ message: 'Ad set duplicado com sucesso', new_adset_id: result.ad_set_id }, null, 2);
    }

    default:
      throw new Error(`Unknown adset tool: ${name}`);
  }
}
