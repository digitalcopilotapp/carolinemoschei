import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

const AD_FIELDS =
  'id,name,adset_id,campaign_id,status,effective_status,creative{id,name,thumbnail_url},created_time,updated_time,review_feedback,policy_issues';

export const adTools: Tool[] = [
  {
    name: 'get_ads',
    description: 'Lista anúncios de um ad set ou da conta ativa',
    inputSchema: {
      type: 'object',
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set (opcional — se omitido, lista da conta)' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] },
        limit: { type: 'number', description: 'Limite de resultados (padrão: 25)' },
      },
    },
  },
  {
    name: 'get_ad_details',
    description: 'Retorna detalhes de um anúncio incluindo review_feedback e policy_issues',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'create_ad',
    description: 'Cria um anúncio vinculando ad set + criativo',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do anúncio' },
        adset_id: { type: 'string', description: 'ID do ad set' },
        creative_id: { type: 'string', description: 'ID do criativo' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'Status inicial (padrão: PAUSED)' },
      },
      required: ['name', 'adset_id', 'creative_id'],
    },
  },
  {
    name: 'update_ad',
    description: 'Atualiza campos de um anúncio',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'] },
        creative_id: { type: 'string', description: 'Novo criativo' },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'delete_ad',
    description: 'Remove um anúncio (requer confirmação)',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
        confirm: { type: 'boolean', description: 'Deve ser true para confirmar' },
      },
      required: ['ad_id', 'confirm'],
    },
  },
  {
    name: 'duplicate_ad',
    description: 'Duplica um anúncio existente',
    inputSchema: {
      type: 'object',
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio a duplicar' },
        adset_id: { type: 'string', description: 'Ad set destino (opcional)' },
      },
      required: ['ad_id'],
    },
  },
];

export async function handleAdTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'get_ads': {
      const parentId = (args.adset_id as string) || serverState.getActiveAccountId();
      const params: Record<string, unknown> = { fields: AD_FIELDS, limit: args.limit ?? 25 };
      if (args.status) {
        params.filtering = JSON.stringify([{ field: 'effective_status', operator: 'IN', value: [args.status] }]);
      }
      const ads = await metaPaginatedRequest({ path: `/${parentId}/ads`, params });
      return JSON.stringify(ads, null, 2);
    }

    case 'get_ad_details': {
      const result = await metaRequest({ path: `/${args.ad_id}`, params: { fields: AD_FIELDS } });
      return JSON.stringify(result, null, 2);
    }

    case 'create_ad': {
      const accountId = serverState.getActiveAccountId();
      const result = await metaRequest<{ id: string }>({
        method: 'POST',
        path: `/${accountId}/ads`,
        params: {
          name: args.name,
          adset_id: args.adset_id,
          creative: JSON.stringify({ creative_id: args.creative_id }),
          status: args.status ?? 'PAUSED',
        },
      });
      return JSON.stringify({ message: 'Anúncio criado com sucesso', ad_id: result.id }, null, 2);
    }

    case 'update_ad': {
      const { ad_id, ...updates } = args;
      const params: Record<string, unknown> = {};
      if (updates.name) params.name = updates.name;
      if (updates.status) params.status = updates.status;
      if (updates.creative_id) params.creative = JSON.stringify({ creative_id: updates.creative_id });
      await metaRequest({ method: 'POST', path: `/${ad_id}`, params });
      return JSON.stringify({ message: 'Anúncio atualizado com sucesso', ad_id }, null, 2);
    }

    case 'delete_ad': {
      if (!args.confirm) throw new Error('Defina confirm=true para confirmar a exclusão.');
      await metaRequest({ method: 'POST', path: `/${args.ad_id}`, params: { status: 'DELETED' } });
      return JSON.stringify({ message: 'Anúncio deletado com sucesso', ad_id: args.ad_id }, null, 2);
    }

    case 'duplicate_ad': {
      const params: Record<string, unknown> = {};
      if (args.adset_id) params.adset_id = args.adset_id;
      const result = await metaRequest<{ ad_id: string }>({ method: 'POST', path: `/${args.ad_id}/copies`, params });
      return JSON.stringify({ message: 'Anúncio duplicado com sucesso', new_ad_id: result.ad_id }, null, 2);
    }

    default:
      throw new Error(`Unknown ad tool: ${name}`);
  }
}
