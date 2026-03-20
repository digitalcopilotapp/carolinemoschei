import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';
import * as crypto from 'crypto';

const AUDIENCE_FIELDS = 'id,name,subtype,description,approximate_count,data_source,delivery_status,operation_status,permission_for_actions,time_created,time_updated';

export const audienceTools: Tool[] = [
  {
    name: 'get_custom_audiences',
    description: 'Lista audiências customizadas da conta ativa',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
  },
  {
    name: 'create_custom_audience',
    description: 'Cria uma audiência customizada (website, customer_list, engagement, app_activity)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da audiência' },
        subtype: { type: 'string', enum: ['WEBSITE', 'CUSTOM', 'ENGAGEMENT', 'APP'], description: 'Tipo da audiência' },
        description: { type: 'string' },
        customer_file_source: { type: 'string', enum: ['USER_PROVIDED_ONLY', 'PARTNER_PROVIDED_ONLY', 'BOTH_USER_AND_PARTNER_PROVIDED'] },
        rule: { type: 'object', description: 'Regra de targeting (para WEBSITE/ENGAGEMENT)' },
        pixel_id: { type: 'string', description: 'Pixel ID (para WEBSITE)' },
        retention_days: { type: 'number', description: 'Dias de retenção (para WEBSITE)' },
      },
      required: ['name', 'subtype'],
    },
  },
  {
    name: 'create_lookalike_audience',
    description: 'Cria audiência lookalike a partir de uma audiência fonte',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da lookalike' },
        source_audience_id: { type: 'string', description: 'ID da audiência fonte' },
        country: { type: 'string', description: 'Código do país (ex: BR)' },
        ratio: { type: 'number', description: 'Tamanho da lookalike (0.01 a 0.20 = 1% a 20%)' },
      },
      required: ['name', 'source_audience_id', 'country', 'ratio'],
    },
  },
  {
    name: 'update_audience',
    description: 'Atualiza uma audiência existente',
    inputSchema: {
      type: 'object',
      properties: {
        audience_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['audience_id'],
    },
  },
  {
    name: 'delete_audience',
    description: 'Remove uma audiência',
    inputSchema: {
      type: 'object',
      properties: {
        audience_id: { type: 'string' },
        confirm: { type: 'boolean' },
      },
      required: ['audience_id', 'confirm'],
    },
  },
  {
    name: 'estimate_audience_size',
    description: 'Estima o alcance de um targeting spec',
    inputSchema: {
      type: 'object',
      properties: {
        targeting_spec: { type: 'object', description: 'Targeting spec (geo_locations, age_min, age_max, interests, etc.)' },
      },
      required: ['targeting_spec'],
    },
  },
  {
    name: 'search_interests',
    description: 'Busca interesses para targeting por palavra-chave',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Termo de busca' }, limit: { type: 'number' } },
      required: ['query'],
    },
  },
  {
    name: 'search_behaviors',
    description: 'Busca comportamentos para targeting',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, limit: { type: 'number' } },
      required: ['query'],
    },
  },
  {
    name: 'search_demographics',
    description: 'Busca dados demográficos para targeting',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, limit: { type: 'number' } },
      required: ['query'],
    },
  },
  {
    name: 'search_geo_locations',
    description: 'Busca localizações para targeting',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        type: { type: 'string', enum: ['country', 'region', 'city', 'zip', 'geo_market'], description: 'Tipo de localização' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
];

function hashPII(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

// Keep hashPII available for future customer_list upload
void hashPII;

export async function handleAudienceTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'get_custom_audiences': {
      const audiences = await metaPaginatedRequest({
        path: `/${accountId}/customaudiences`,
        params: { fields: AUDIENCE_FIELDS, limit: args.limit ?? 25 },
      });
      return JSON.stringify(audiences, null, 2);
    }

    case 'create_custom_audience': {
      const params: Record<string, unknown> = { name: args.name, subtype: args.subtype };
      if (args.description) params.description = args.description;
      if (args.customer_file_source) params.customer_file_source = args.customer_file_source;
      if (args.rule) params.rule = args.rule;
      if (args.pixel_id) params.pixel_id = args.pixel_id;
      if (args.retention_days) params.retention_days = args.retention_days;

      const result = await metaRequest<{ id: string }>({ method: 'POST', path: `/${accountId}/customaudiences`, params });
      return JSON.stringify({ message: 'Audiência criada com sucesso', audience_id: result.id }, null, 2);
    }

    case 'create_lookalike_audience': {
      const params = {
        name: args.name,
        origin_audience_id: args.source_audience_id,
        lookalike_spec: JSON.stringify({
          country: args.country,
          ratio: args.ratio,
          type: 'similarity',
        }),
        subtype: 'LOOKALIKE',
      };
      const result = await metaRequest<{ id: string }>({ method: 'POST', path: `/${accountId}/customaudiences`, params });
      return JSON.stringify({ message: 'Lookalike criada com sucesso', audience_id: result.id }, null, 2);
    }

    case 'update_audience': {
      const { audience_id, ...updates } = args;
      await metaRequest({ method: 'POST', path: `/${audience_id}`, params: updates });
      return JSON.stringify({ message: 'Audiência atualizada', audience_id }, null, 2);
    }

    case 'delete_audience': {
      if (!args.confirm) throw new Error('Defina confirm=true para confirmar.');
      await metaRequest({ method: 'DELETE', path: `/${args.audience_id}` });
      return JSON.stringify({ message: 'Audiência removida', audience_id: args.audience_id }, null, 2);
    }

    case 'estimate_audience_size': {
      const result = await metaRequest({
        path: `/${accountId}/reachestimate`,
        params: { targeting_spec: args.targeting_spec },
      });
      return JSON.stringify(result, null, 2);
    }

    case 'search_interests': {
      const result = await metaRequest({ path: '/search', params: { type: 'adinterest', q: args.query, limit: args.limit ?? 20 } });
      return JSON.stringify(result, null, 2);
    }

    case 'search_behaviors': {
      const result = await metaRequest({ path: '/search', params: { type: 'adTargetingCategory', class: 'behaviors', q: args.query, limit: args.limit ?? 20 } });
      return JSON.stringify(result, null, 2);
    }

    case 'search_demographics': {
      const result = await metaRequest({ path: '/search', params: { type: 'adTargetingCategory', class: 'demographics', q: args.query, limit: args.limit ?? 20 } });
      return JSON.stringify(result, null, 2);
    }

    case 'search_geo_locations': {
      const result = await metaRequest({ path: '/search', params: { type: 'adgeolocation', location_types: args.type ? [args.type] : ['country', 'region', 'city'], q: args.query, limit: args.limit ?? 20 } });
      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown audience tool: ${name}`);
  }
}
