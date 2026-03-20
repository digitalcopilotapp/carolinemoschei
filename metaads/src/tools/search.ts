import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const searchTools: Tool[] = [
  {
    name: 'search',
    description: 'Busca por nome em campanhas, ad sets e anúncios',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Termo de busca' },
        type: { type: 'string', enum: ['campaigns', 'adsets', 'ads', 'all'], description: 'Tipo de objeto (padrão: all)' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_account_overview',
    description: 'Resumo da conta: total campanhas ativas, gasto total, top campanhas por gasto',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: { type: 'object', properties: { since: { type: 'string' }, until: { type: 'string' } }, description: 'Período para métricas (YYYY-MM-DD)' },
      },
    },
  },
  {
    name: 'get_campaign_tree',
    description: 'Exibe árvore hierárquica: campanha → ad sets → ads',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
      },
      required: ['campaign_id'],
    },
  },
];

export async function handleSearchTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'search': {
      const query = args.query as string;
      const type = (args.type as string) || 'all';
      const limit = (args.limit as number) || 10;
      const results: Record<string, unknown[]> = {};

      const searchEndpoint = async (endpoint: string, label: string) => {
        const items = await metaPaginatedRequest({
          path: `/${accountId}/${endpoint}`,
          params: {
            fields: 'id,name,status,effective_status',
            filtering: JSON.stringify([{ field: 'name', operator: 'CONTAIN', value: query }]),
            limit,
          },
        });
        results[label] = items;
      };

      const tasks: Promise<void>[] = [];
      if (type === 'all' || type === 'campaigns') tasks.push(searchEndpoint('campaigns', 'campaigns'));
      if (type === 'all' || type === 'adsets') tasks.push(searchEndpoint('adsets', 'adsets'));
      if (type === 'all' || type === 'ads') tasks.push(searchEndpoint('ads', 'ads'));
      await Promise.all(tasks);

      return JSON.stringify(results, null, 2);
    }

    case 'get_account_overview': {
      const [campaigns, insights] = await Promise.all([
        metaPaginatedRequest({
          path: `/${accountId}/campaigns`,
          params: {
            fields: 'id,name,status,effective_status',
            filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]),
          },
        }),
        metaRequest<{ data: Array<Record<string, unknown>> }>({
          path: `/${accountId}/insights`,
          params: {
            fields: 'spend,impressions,clicks,ctr,cpc',
            ...(args.date_range ? { time_range: JSON.stringify(args.date_range) } : {}),
          },
        }),
      ]);

      return JSON.stringify({
        active_campaigns: (campaigns as unknown[]).length,
        campaigns: campaigns,
        insights: insights.data?.[0] ?? null,
      }, null, 2);
    }

    case 'get_campaign_tree': {
      const campaignId = args.campaign_id as string;
      const [campaign, adsets] = await Promise.all([
        metaRequest({
          path: `/${campaignId}`,
          params: { fields: 'id,name,status,objective' },
        }),
        metaPaginatedRequest<Record<string, unknown>>({
          path: `/${campaignId}/adsets`,
          params: { fields: 'id,name,status,effective_status' },
        }),
      ]);

      // Fetch ads for each ad set in parallel
      const adsetWithAds = await Promise.all(
        adsets.map(async (adset) => {
          const ads = await metaPaginatedRequest({
            path: `/${adset.id}/ads`,
            params: { fields: 'id,name,status,effective_status' },
          });
          return { ...adset, ads };
        })
      );

      return JSON.stringify({
        campaign,
        adsets: adsetWithAds,
      }, null, 2);
    }

    default:
      throw new Error(`Unknown search tool: ${name}`);
  }
}
