import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';

export const budgetTools: Tool[] = [
  {
    name: 'create_budget_schedule',
    description: 'Cria um agendamento de budget para uma campanha',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        budget_value: { type: 'number', description: 'Valor do budget em centavos' },
        budget_value_type: { type: 'string', enum: ['DAILY', 'LIFETIME'], description: 'Tipo de budget' },
        time_start: { type: 'string', description: 'Início do agendamento (ISO 8601)' },
        time_end: { type: 'string', description: 'Fim do agendamento (ISO 8601)' },
      },
      required: ['campaign_id', 'budget_value', 'time_start'],
    },
  },
  {
    name: 'get_budget_schedules',
    description: 'Lista agendamentos de budget de uma campanha',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'update_budget_schedule',
    description: 'Atualiza um agendamento de budget existente',
    inputSchema: {
      type: 'object',
      properties: {
        schedule_id: { type: 'string', description: 'ID do agendamento' },
        budget_value: { type: 'number' },
        time_start: { type: 'string' },
        time_end: { type: 'string' },
      },
      required: ['schedule_id'],
    },
  },
  {
    name: 'delete_budget_schedule',
    description: 'Remove um agendamento de budget',
    inputSchema: {
      type: 'object',
      properties: {
        schedule_id: { type: 'string', description: 'ID do agendamento' },
        confirm: { type: 'boolean' },
      },
      required: ['schedule_id', 'confirm'],
    },
  },
];

export async function handleBudgetTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'create_budget_schedule': {
      const params: Record<string, unknown> = {
        budget_value: args.budget_value,
        time_start: args.time_start,
      };
      if (args.budget_value_type) params.budget_value_type = args.budget_value_type;
      if (args.time_end) params.time_end = args.time_end;

      const result = await metaRequest<{ id: string }>({
        method: 'POST',
        path: `/${args.campaign_id}/budget_schedules`,
        params,
      });
      return JSON.stringify({ message: 'Agendamento de budget criado', schedule_id: result.id }, null, 2);
    }

    case 'get_budget_schedules': {
      const schedules = await metaPaginatedRequest({
        path: `/${args.campaign_id}/budget_schedules`,
        params: { fields: 'id,budget_value,budget_value_type,time_start,time_end,status' },
      });
      return JSON.stringify(schedules, null, 2);
    }

    case 'update_budget_schedule': {
      const { schedule_id, ...updates } = args;
      await metaRequest({ method: 'POST', path: `/${schedule_id}`, params: updates });
      return JSON.stringify({ message: 'Agendamento atualizado', schedule_id }, null, 2);
    }

    case 'delete_budget_schedule': {
      if (!args.confirm) throw new Error('Defina confirm=true para confirmar.');
      await metaRequest({ method: 'DELETE', path: `/${args.schedule_id}` });
      return JSON.stringify({ message: 'Agendamento removido', schedule_id: args.schedule_id }, null, 2);
    }

    default:
      throw new Error(`Unknown budget tool: ${name}`);
  }
}
