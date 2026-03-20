import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const accountTools: Tool[] = [
  {
    name: 'get_ad_accounts',
    description: 'Lista todas as contas de anúncios vinculadas ao usuário autenticado',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_active_account',
    description: 'Define a conta de anúncios ativa para todas as operações subsequentes',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: 'ID da conta de anúncios (ex: act_123456789)',
        },
      },
      required: ['account_id'],
    },
  },
];

interface AdAccountResponse {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  spend_cap: string;
  amount_spent: string;
}

const ACCOUNT_STATUS_MAP: Record<number, string> = {
  1: 'ACTIVE',
  2: 'DISABLED',
  3: 'UNSETTLED',
  7: 'PENDING_RISK_REVIEW',
  8: 'PENDING_SETTLEMENT',
  9: 'IN_GRACE_PERIOD',
  100: 'PENDING_CLOSURE',
  101: 'CLOSED',
  201: 'ANY_ACTIVE',
  202: 'ANY_CLOSED',
};

export async function handleAccountTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  if (name === 'get_ad_accounts') {
    const user = serverState.user;
    if (!user) throw new Error('Não autenticado. Configure META_SYSTEM_USER_TOKEN.');

    const accounts = await metaPaginatedRequest<AdAccountResponse>({
      path: `/${user.id}/adaccounts`,
      params: {
        fields: 'id,account_id,name,currency,timezone_name,account_status,spend_cap,amount_spent',
      },
    });

    if (accounts.length === 0) {
      return 'Nenhuma conta de anúncios encontrada.';
    }

    const formatted = accounts.map((acc) => ({
      account_id: acc.id,
      name: acc.name,
      currency: acc.currency,
      timezone: acc.timezone_name,
      status: ACCOUNT_STATUS_MAP[acc.account_status] ?? `UNKNOWN(${acc.account_status})`,
      spend_cap: acc.spend_cap ?? 'Sem limite',
      amount_spent: acc.amount_spent,
    }));

    return JSON.stringify(formatted, null, 2);
  }

  if (name === 'set_active_account') {
    const accountId = args.account_id as string;
    const id = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

    const account = await metaRequest<AdAccountResponse>({
      path: `/${id}`,
      params: {
        fields: 'id,account_id,name,currency,timezone_name,account_status',
      },
    });

    serverState.setActiveAccount({
      accountId: account.id,
      name: account.name,
      currency: account.currency,
      timezone: account.timezone_name,
      status: account.account_status,
    });

    const statusLabel = ACCOUNT_STATUS_MAP[account.account_status] ?? 'UNKNOWN';

    return JSON.stringify(
      {
        message: `Conta ativa definida: ${account.name}`,
        account_id: account.id,
        name: account.name,
        currency: account.currency,
        timezone: account.timezone_name,
        status: statusLabel,
      },
      null,
      2
    );
  }

  throw new Error(`Unknown account tool: ${name}`);
}
