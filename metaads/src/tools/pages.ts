import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const pageTools: Tool[] = [
  {
    name: 'get_account_pages',
    description: 'Lista páginas do Facebook vinculadas à conta de anúncios',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_instagram_accounts',
    description: 'Lista contas de Instagram vinculadas à conta de anúncios',
    inputSchema: { type: 'object', properties: {} },
  },
];

export async function handlePageTool(name: string, _args: Record<string, unknown>): Promise<string> {
  const user = serverState.user;
  if (!user) throw new Error('Não autenticado.');

  switch (name) {
    case 'get_account_pages': {
      const pages = await metaPaginatedRequest({
        path: `/${user.id}/accounts`,
        params: { fields: 'id,name,category,access_token,fan_count,verification_status' },
      });
      // Remove access_token from response for security
      const safPages = (pages as Array<Record<string, unknown>>).map((p) => ({
        ...p,
        access_token: p.access_token ? 'present' : 'missing',
      }));
      return JSON.stringify(safPages, null, 2);
    }

    case 'get_instagram_accounts': {
      const pages = await metaPaginatedRequest({
        path: `/${user.id}/accounts`,
        params: { fields: 'id,name,instagram_business_account{id,name,username,profile_picture_url,followers_count}' },
      });
      const igAccounts = (pages as Array<Record<string, unknown>>)
        .filter((p) => p.instagram_business_account)
        .map((p) => ({
          page_id: p.id,
          page_name: p.name,
          instagram: p.instagram_business_account,
        }));
      return JSON.stringify(igAccounts, null, 2);
    }

    default:
      throw new Error(`Unknown page tool: ${name}`);
  }
}
