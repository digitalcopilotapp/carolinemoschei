import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const catalogTools: Tool[] = [
  {
    name: 'list_catalogs',
    description: 'Lista catálogos de produtos da conta',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_catalog_details',
    description: 'Detalhes de um catálogo específico',
    inputSchema: {
      type: 'object',
      properties: { catalog_id: { type: 'string' } },
      required: ['catalog_id'],
    },
  },
  {
    name: 'list_product_sets',
    description: 'Lista conjuntos de produtos de um catálogo',
    inputSchema: {
      type: 'object',
      properties: { catalog_id: { type: 'string' } },
      required: ['catalog_id'],
    },
  },
  {
    name: 'get_product_set_details',
    description: 'Detalhes de um conjunto de produtos',
    inputSchema: {
      type: 'object',
      properties: { product_set_id: { type: 'string' } },
      required: ['product_set_id'],
    },
  },
  {
    name: 'create_product_set',
    description: 'Cria um conjunto de produtos com filtros',
    inputSchema: {
      type: 'object',
      properties: {
        catalog_id: { type: 'string' },
        name: { type: 'string' },
        filter: { type: 'object', description: 'Filtro de produtos (ex: {"product_type":{"i_contains":"shoes"}})' },
      },
      required: ['catalog_id', 'name', 'filter'],
    },
  },
];

export async function handleCatalogTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'list_catalogs': {
      const user = serverState.user;
      if (!user) throw new Error('Não autenticado.');
      const catalogs = await metaPaginatedRequest({
        path: `/${user.id}/owned_product_catalogs`,
        params: { fields: 'id,name,product_count,vertical' },
      });
      return JSON.stringify(catalogs, null, 2);
    }

    case 'get_catalog_details': {
      const result = await metaRequest({
        path: `/${args.catalog_id}`,
        params: { fields: 'id,name,product_count,vertical,business' },
      });
      return JSON.stringify(result, null, 2);
    }

    case 'list_product_sets': {
      const sets = await metaPaginatedRequest({
        path: `/${args.catalog_id}/product_sets`,
        params: { fields: 'id,name,product_count,filter' },
      });
      return JSON.stringify(sets, null, 2);
    }

    case 'get_product_set_details': {
      const result = await metaRequest({
        path: `/${args.product_set_id}`,
        params: { fields: 'id,name,product_count,filter' },
      });
      return JSON.stringify(result, null, 2);
    }

    case 'create_product_set': {
      const result = await metaRequest<{ id: string }>({
        method: 'POST',
        path: `/${args.catalog_id}/product_sets`,
        params: { name: args.name, filter: args.filter },
      });
      return JSON.stringify({ message: 'Conjunto de produtos criado', product_set_id: result.id }, null, 2);
    }

    default:
      throw new Error(`Unknown catalog tool: ${name}`);
  }
}
