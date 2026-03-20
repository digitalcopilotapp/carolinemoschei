import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const pixelTools: Tool[] = [
  {
    name: 'get_pixels',
    description: 'Lista pixels da conta ativa',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_pixel_stats',
    description: 'Estatísticas de um pixel (eventos recebidos, última atividade)',
    inputSchema: {
      type: 'object',
      properties: { pixel_id: { type: 'string', description: 'ID do pixel' } },
      required: ['pixel_id'],
    },
  },
  {
    name: 'create_custom_conversion',
    description: 'Cria uma conversão customizada com regras de URL ou evento',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        pixel_id: { type: 'string', description: 'ID do pixel' },
        event_source_type: { type: 'string', enum: ['WEB', 'APP'], description: 'Fonte do evento' },
        rule: { type: 'string', description: 'Regra JSON (ex: {"url":{"i_contains":"thank-you"}})' },
        custom_event_type: { type: 'string', description: 'Tipo de evento customizado' },
        default_conversion_value: { type: 'number' },
      },
      required: ['name', 'pixel_id', 'rule'],
    },
  },
  {
    name: 'get_custom_conversions',
    description: 'Lista conversões customizadas da conta ativa',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_server_events_status',
    description: 'Status da Conversions API (CAPI) de um pixel',
    inputSchema: {
      type: 'object',
      properties: { pixel_id: { type: 'string' } },
      required: ['pixel_id'],
    },
  },
];

export async function handlePixelTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'get_pixels': {
      const pixels = await metaPaginatedRequest({
        path: `/${accountId}/adspixels`,
        params: { fields: 'id,name,code,creation_time,last_fired_time,is_created_by_business' },
      });
      return JSON.stringify(pixels, null, 2);
    }

    case 'get_pixel_stats': {
      const result = await metaRequest({
        path: `/${args.pixel_id}`,
        params: { fields: 'id,name,last_fired_time,is_created_by_business,code' },
      });
      const stats = await metaRequest({
        path: `/${args.pixel_id}/stats`,
        params: { aggregation: 'event' },
      });
      return JSON.stringify({ pixel: result, stats }, null, 2);
    }

    case 'create_custom_conversion': {
      const params: Record<string, unknown> = {
        name: args.name,
        pixel_id: args.pixel_id,
        rule: args.rule,
      };
      if (args.event_source_type) params.event_source_type = args.event_source_type;
      if (args.custom_event_type) params.custom_event_type = args.custom_event_type;
      if (args.default_conversion_value) params.default_conversion_value = args.default_conversion_value;

      const result = await metaRequest<{ id: string }>({ method: 'POST', path: `/${accountId}/customconversions`, params });
      return JSON.stringify({ message: 'Conversão customizada criada', id: result.id }, null, 2);
    }

    case 'get_custom_conversions': {
      const conversions = await metaPaginatedRequest({
        path: `/${accountId}/customconversions`,
        params: { fields: 'id,name,pixel,rule,custom_event_type,default_conversion_value,creation_time' },
      });
      return JSON.stringify(conversions, null, 2);
    }

    case 'get_server_events_status': {
      const result = await metaRequest({
        path: `/${args.pixel_id}/server_events_config`,
        params: { fields: 'config,first_event_timestamp,last_event_timestamp,server_event_business_ids' },
      });
      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown pixel tool: ${name}`);
  }
}
