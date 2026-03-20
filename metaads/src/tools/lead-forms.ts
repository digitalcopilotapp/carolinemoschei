import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const leadFormTools: Tool[] = [
  {
    name: 'get_lead_gen_forms',
    description: 'Lista formulários de lead generation da conta ativa',
    inputSchema: { type: 'object', properties: { page_id: { type: 'string', description: 'ID da página (obrigatório — formulários pertencem a páginas)' } }, required: ['page_id'] },
  },
  {
    name: 'create_lead_gen_form',
    description: 'Cria um formulário de lead generation',
    inputSchema: {
      type: 'object',
      properties: {
        page_id: { type: 'string', description: 'ID da página' },
        name: { type: 'string' },
        questions: { type: 'array', items: { type: 'object' }, description: 'Perguntas do formulário (ex: [{type:"EMAIL"},{type:"FULL_NAME"}])' },
        privacy_policy_url: { type: 'string', description: 'URL da política de privacidade (obrigatório LGPD/GDPR)' },
        follow_up_action_url: { type: 'string', description: 'URL de redirecionamento após envio' },
      },
      required: ['page_id', 'name', 'questions', 'privacy_policy_url'],
    },
  },
  {
    name: 'get_leads',
    description: 'Recupera leads enviados de um formulário',
    inputSchema: {
      type: 'object',
      properties: {
        form_id: { type: 'string', description: 'ID do formulário' },
        limit: { type: 'number' },
      },
      required: ['form_id'],
    },
  },
  {
    name: 'update_lead_gen_form_status',
    description: 'Ativa ou desativa um formulário de lead',
    inputSchema: {
      type: 'object',
      properties: {
        form_id: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED'] },
      },
      required: ['form_id', 'status'],
    },
  },
];

export async function handleLeadFormTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'get_lead_gen_forms': {
      const forms = await metaPaginatedRequest({
        path: `/${args.page_id}/leadgen_forms`,
        params: { fields: 'id,name,status,leads_count,created_time,questions,privacy_policy' },
      });
      return JSON.stringify(forms, null, 2);
    }

    case 'create_lead_gen_form': {
      const params: Record<string, unknown> = {
        name: args.name,
        questions: args.questions,
        privacy_policy: JSON.stringify({ url: args.privacy_policy_url }),
      };
      if (args.follow_up_action_url) {
        params.follow_up_action_url = args.follow_up_action_url;
      }
      const result = await metaRequest<{ id: string }>({
        method: 'POST',
        path: `/${args.page_id}/leadgen_forms`,
        params,
      });
      return JSON.stringify({ message: 'Formulário criado com sucesso', form_id: result.id }, null, 2);
    }

    case 'get_leads': {
      const leads = await metaPaginatedRequest({
        path: `/${args.form_id}/leads`,
        params: { fields: 'id,created_time,field_data', limit: args.limit ?? 50 },
      });
      return JSON.stringify(leads, null, 2);
    }

    case 'update_lead_gen_form_status': {
      await metaRequest({
        method: 'POST',
        path: `/${args.form_id}`,
        params: { status: args.status },
      });
      return JSON.stringify({ message: `Formulário ${args.status === 'ACTIVE' ? 'ativado' : 'arquivado'}`, form_id: args.form_id }, null, 2);
    }

    default:
      throw new Error(`Unknown lead form tool: ${name}`);
  }
}
