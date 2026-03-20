import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaPaginatedRequest, metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

const CREATIVE_FIELDS =
  'id,name,title,body,thumbnail_url,object_story_spec,call_to_action_type,status,created_time';

export const creativeTools: Tool[] = [
  {
    name: 'get_ad_creatives',
    description: 'Lista criativos da conta ativa',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Limite de resultados (padrão: 25)' },
      },
    },
  },
  {
    name: 'get_creative_details',
    description: 'Retorna detalhes completos de um criativo',
    inputSchema: {
      type: 'object',
      properties: {
        creative_id: { type: 'string', description: 'ID do criativo' },
      },
      required: ['creative_id'],
    },
  },
  {
    name: 'create_ad_creative',
    description: 'Cria um criativo de anúncio (link, vídeo ou imagem)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do criativo' },
        page_id: { type: 'string', description: 'ID da página do Facebook' },
        link: { type: 'string', description: 'URL de destino' },
        message: { type: 'string', description: 'Texto principal (max 125 chars recomendado)' },
        headline: { type: 'string', description: 'Título (max 40 chars recomendado)' },
        description: { type: 'string', description: 'Descrição (max 30 chars recomendado)' },
        image_hash: { type: 'string', description: 'Hash da imagem (do upload_ad_image)' },
        video_id: { type: 'string', description: 'ID do vídeo (do upload_ad_video)' },
        call_to_action_type: { type: 'string', description: 'Tipo de CTA (ex: LEARN_MORE, SHOP_NOW, SIGN_UP)' },
        instagram_actor_id: { type: 'string', description: 'ID da conta Instagram (opcional)' },
      },
      required: ['name', 'page_id', 'link'],
    },
  },
  {
    name: 'create_carousel_creative',
    description: 'Cria um criativo carrossel com múltiplos cards',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do criativo' },
        page_id: { type: 'string', description: 'ID da página do Facebook' },
        message: { type: 'string', description: 'Texto principal do post' },
        cards: {
          type: 'array',
          description: 'Cards do carrossel (2-10)',
          items: {
            type: 'object',
            properties: {
              link: { type: 'string' },
              name: { type: 'string', description: 'Headline do card' },
              description: { type: 'string' },
              image_hash: { type: 'string' },
              video_id: { type: 'string' },
              call_to_action_type: { type: 'string' },
            },
            required: ['link'],
          },
        },
        instagram_actor_id: { type: 'string' },
      },
      required: ['name', 'page_id', 'cards'],
    },
  },
  {
    name: 'update_ad_creative',
    description: 'Atualiza um criativo existente',
    inputSchema: {
      type: 'object',
      properties: {
        creative_id: { type: 'string', description: 'ID do criativo' },
        name: { type: 'string' },
      },
      required: ['creative_id'],
    },
  },
];

function warnTextLimits(args: Record<string, unknown>): string[] {
  const warnings: string[] = [];
  const message = args.message as string | undefined;
  const headline = args.headline as string | undefined;
  const description = args.description as string | undefined;
  if (message && message.length > 125) warnings.push(`Texto principal tem ${message.length} chars (recomendado: 125)`);
  if (headline && headline.length > 40) warnings.push(`Headline tem ${headline.length} chars (recomendado: 40)`);
  if (description && description.length > 30) warnings.push(`Descrição tem ${description.length} chars (recomendado: 30)`);
  return warnings;
}

export async function handleCreativeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'get_ad_creatives': {
      const creatives = await metaPaginatedRequest({
        path: `/${accountId}/adcreatives`,
        params: { fields: CREATIVE_FIELDS, limit: args.limit ?? 25 },
      });
      return JSON.stringify(creatives, null, 2);
    }

    case 'get_creative_details': {
      const result = await metaRequest({ path: `/${args.creative_id}`, params: { fields: CREATIVE_FIELDS } });
      return JSON.stringify(result, null, 2);
    }

    case 'create_ad_creative': {
      const warnings = warnTextLimits(args);

      const linkData: Record<string, unknown> = {
        link: args.link,
        message: args.message,
        name: args.headline,
        description: args.description,
      };
      if (args.image_hash) linkData.image_hash = args.image_hash;
      if (args.call_to_action_type) {
        linkData.call_to_action = { type: args.call_to_action_type, value: { link: args.link } };
      }

      const objectStorySpec: Record<string, unknown> = {
        page_id: args.page_id,
      };

      if (args.video_id) {
        objectStorySpec.video_data = {
          video_id: args.video_id,
          message: args.message,
          title: args.headline,
          link_description: args.description,
          call_to_action: args.call_to_action_type
            ? { type: args.call_to_action_type, value: { link: args.link } }
            : undefined,
          image_hash: args.image_hash,
        };
      } else {
        objectStorySpec.link_data = linkData;
      }

      const params: Record<string, unknown> = {
        name: args.name,
        object_story_spec: objectStorySpec,
      };
      if (args.instagram_actor_id) params.instagram_actor_id = args.instagram_actor_id;

      const result = await metaRequest<{ id: string }>({ method: 'POST', path: `/${accountId}/adcreatives`, params });
      const response: Record<string, unknown> = { message: 'Criativo criado com sucesso', creative_id: result.id };
      if (warnings.length > 0) response.warnings = warnings;
      return JSON.stringify(response, null, 2);
    }

    case 'create_carousel_creative': {
      const cards = args.cards as Array<Record<string, unknown>>;
      if (!cards || cards.length < 2) throw new Error('Carrossel precisa de pelo menos 2 cards.');

      const childAttachments = cards.map((card) => {
        const attachment: Record<string, unknown> = { link: card.link };
        if (card.name) attachment.name = card.name;
        if (card.description) attachment.description = card.description;
        if (card.image_hash) attachment.image_hash = card.image_hash;
        if (card.video_id) attachment.video_id = card.video_id;
        if (card.call_to_action_type) {
          attachment.call_to_action = { type: card.call_to_action_type, value: { link: card.link } };
        }
        return attachment;
      });

      const objectStorySpec: Record<string, unknown> = {
        page_id: args.page_id,
        link_data: {
          message: args.message,
          link: (cards[0] as Record<string, unknown>).link,
          child_attachments: childAttachments,
        },
      };

      const params: Record<string, unknown> = {
        name: args.name,
        object_story_spec: objectStorySpec,
      };
      if (args.instagram_actor_id) params.instagram_actor_id = args.instagram_actor_id;

      const result = await metaRequest<{ id: string }>({ method: 'POST', path: `/${accountId}/adcreatives`, params });
      return JSON.stringify({ message: 'Criativo carrossel criado com sucesso', creative_id: result.id }, null, 2);
    }

    case 'update_ad_creative': {
      const { creative_id, ...updates } = args;
      const params: Record<string, unknown> = {};
      if (updates.name) params.name = updates.name;
      await metaRequest({ method: 'POST', path: `/${creative_id}`, params });
      return JSON.stringify({ message: 'Criativo atualizado com sucesso', creative_id }, null, 2);
    }

    default:
      throw new Error(`Unknown creative tool: ${name}`);
  }
}
