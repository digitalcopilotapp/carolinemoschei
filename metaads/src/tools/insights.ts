import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const insightTools: Tool[] = [
  {
    name: 'get_insights',
    description: 'Relatórios de performance (síncrono) para conta, campanha, ad set ou ad',
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['account', 'campaign', 'adset', 'ad'], description: 'Nível do relatório' },
        object_id: { type: 'string', description: 'ID do objeto (campaign_id, adset_id, ad_id). Se omitido, usa a conta ativa.' },
        date_range: {
          type: 'object',
          properties: { since: { type: 'string' }, until: { type: 'string' } },
          description: 'Período (YYYY-MM-DD)',
        },
        time_increment: { type: 'string', description: 'daily, weekly, monthly, all_days (padrão: all_days)' },
        fields: {
          type: 'array', items: { type: 'string' },
          description: 'Campos: impressions, clicks, spend, cpc, cpm, ctr, reach, frequency, conversions, actions, action_values, cost_per_action_type',
        },
        breakdowns: {
          type: 'array', items: { type: 'string' },
          description: 'Breakdowns: age, gender, country, region, placement, device_platform, publisher_platform',
        },
        filtering: { type: 'array', description: 'Filtros (ex: [{field: "campaign.id", operator: "IN", value: ["123"]}])' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_insights_async',
    description: 'Relatórios assíncronos para grandes volumes de dados. Cria report run, faz polling e retorna resultado.',
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['account', 'campaign', 'adset', 'ad'] },
        date_range: { type: 'object', properties: { since: { type: 'string' }, until: { type: 'string' } } },
        time_increment: { type: 'string' },
        fields: { type: 'array', items: { type: 'string' } },
        breakdowns: { type: 'array', items: { type: 'string' } },
        filtering: { type: 'array' },
      },
    },
  },
];

const DEFAULT_FIELDS = ['impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr', 'reach', 'frequency'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleInsightTool(name: string, args: Record<string, unknown>): Promise<string> {
  const objectId = (args.object_id as string) || serverState.getActiveAccountId();
  const fields = (args.fields as string[]) || DEFAULT_FIELDS;

  switch (name) {
    case 'get_insights': {
      const params: Record<string, unknown> = {
        fields: fields.join(','),
        time_increment: args.time_increment ?? 'all_days',
        limit: args.limit ?? 100,
      };
      if (args.level) params.level = args.level;
      if (args.date_range) {
        const dr = args.date_range as { since?: string; until?: string };
        if (dr.since && dr.until) params.time_range = JSON.stringify(dr);
      }
      if (args.breakdowns) params.breakdowns = (args.breakdowns as string[]).join(',');
      if (args.filtering) params.filtering = args.filtering;

      const result = await metaRequest<{ data: unknown[] }>({ path: `/${objectId}/insights`, params });
      return JSON.stringify(result.data ?? [], null, 2);
    }

    case 'get_insights_async': {
      const params: Record<string, unknown> = {
        fields: fields.join(','),
        time_increment: args.time_increment ?? 'all_days',
      };
      if (args.level) params.level = args.level;
      if (args.date_range) {
        const dr = args.date_range as { since?: string; until?: string };
        if (dr.since && dr.until) params.time_range = JSON.stringify(dr);
      }
      if (args.breakdowns) params.breakdowns = (args.breakdowns as string[]).join(',');
      if (args.filtering) params.filtering = args.filtering;

      // Create async report run
      const run = await metaRequest<{ report_run_id: string }>({
        method: 'POST',
        path: `/${objectId}/insights`,
        params,
      });

      const runId = run.report_run_id;
      let status = 'Job Running';
      let attempts = 0;
      const maxAttempts = 60;

      while (status !== 'Job Completed' && status !== 'Job Failed' && attempts < maxAttempts) {
        await sleep(3000);
        attempts++;
        const check = await metaRequest<{ async_status: string; async_percent_completion: number }>({
          path: `/${runId}`,
          params: { fields: 'async_status,async_percent_completion' },
        });
        status = check.async_status;
      }

      if (status === 'Job Failed') {
        throw new Error('Relatório assíncrono falhou. Tente com um período menor ou menos breakdowns.');
      }

      if (status !== 'Job Completed') {
        throw new Error(`Relatório não completou a tempo (status: ${status}). Tente novamente.`);
      }

      // Fetch results
      const results = await metaRequest<{ data: unknown[] }>({
        path: `/${runId}/insights`,
        params: { limit: 500 },
      });

      return JSON.stringify(results.data ?? [], null, 2);
    }

    default:
      throw new Error(`Unknown insight tool: ${name}`);
  }
}
