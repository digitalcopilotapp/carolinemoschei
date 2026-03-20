import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const alertTools: Tool[] = [
  {
    name: 'check_ad_review_status',
    description: 'Verifica status de review de anúncios pendentes',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'get_account_alerts',
    description: 'Lista alertas ativos da conta (policy violations, spending limits, payment issues)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_rejected_ads',
    description: 'Lista anúncios rejeitados com motivos de rejeição',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'request_ad_review',
    description: 'Solicita re-review de um anúncio rejeitado',
    inputSchema: {
      type: 'object',
      properties: { ad_id: { type: 'string', description: 'ID do anúncio rejeitado' } },
      required: ['ad_id'],
    },
  },
];

export async function handleAlertTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'check_ad_review_status': {
      const ads = await metaPaginatedRequest({
        path: `/${accountId}/ads`,
        params: {
          fields: 'id,name,effective_status,review_feedback,policy_issues',
          filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['PENDING_REVIEW', 'WITH_ISSUES'] }]),
          limit: args.limit ?? 25,
        },
      });
      return JSON.stringify(ads, null, 2);
    }

    case 'get_account_alerts': {
      // Get account-level status info
      const account = await metaRequest({
        path: `/${accountId}`,
        params: { fields: 'id,name,account_status,disable_reason,spend_cap,amount_spent,balance,currency,funding_source_details' },
      });
      return JSON.stringify(account, null, 2);
    }

    case 'get_rejected_ads': {
      const ads = await metaPaginatedRequest({
        path: `/${accountId}/ads`,
        params: {
          fields: 'id,name,effective_status,review_feedback,policy_issues,created_time',
          filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['DISAPPROVED'] }]),
          limit: args.limit ?? 25,
        },
      });
      return JSON.stringify(ads, null, 2);
    }

    case 'request_ad_review': {
      // Meta doesn't have a direct "re-review" endpoint.
      // The standard approach is to update the ad (even minimally) to trigger re-review.
      await metaRequest({
        method: 'POST',
        path: `/${args.ad_id}`,
        params: { status: 'ACTIVE' },
      });
      return JSON.stringify({
        message: 'Anúncio reativado para re-review. O Meta revisará automaticamente.',
        ad_id: args.ad_id,
      }, null, 2);
    }

    default:
      throw new Error(`Unknown alert tool: ${name}`);
  }
}
