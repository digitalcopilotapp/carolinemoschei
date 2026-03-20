import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { metaRequest } from '../utils/meta-client.js';
import { serverState } from '../auth/index.js';

export const mediaTools: Tool[] = [
  {
    name: 'upload_ad_image',
    description: 'Faz upload de uma imagem para uso em criativos (via URL)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL da imagem para upload' },
        name: { type: 'string', description: 'Nome da imagem (opcional)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'upload_ad_video',
    description: 'Faz upload de um vídeo para uso em criativos (via URL). Faz polling do status de encoding.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL do vídeo para upload' },
        name: { type: 'string', description: 'Nome/título do vídeo' },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_ad_image',
    description: 'Busca uma imagem pelo hash',
    inputSchema: {
      type: 'object',
      properties: {
        image_hash: { type: 'string', description: 'Hash da imagem' },
      },
      required: ['image_hash'],
    },
  },
  {
    name: 'get_ad_video',
    description: 'Busca um vídeo pelo ID incluindo status de encoding',
    inputSchema: {
      type: 'object',
      properties: {
        video_id: { type: 'string', description: 'ID do vídeo' },
      },
      required: ['video_id'],
    },
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleMediaTool(name: string, args: Record<string, unknown>): Promise<string> {
  const accountId = serverState.getActiveAccountId();

  switch (name) {
    case 'upload_ad_image': {
      const params: Record<string, unknown> = { url: args.url };
      if (args.name) params.name = args.name;

      const result = await metaRequest<{ images: Record<string, { hash: string; url: string }> }>({
        method: 'POST',
        path: `/${accountId}/adimages`,
        params,
      });

      const imageData = Object.values(result.images)[0];
      return JSON.stringify({
        message: 'Imagem enviada com sucesso',
        image_hash: imageData?.hash,
        url: imageData?.url,
      }, null, 2);
    }

    case 'upload_ad_video': {
      const params: Record<string, unknown> = { file_url: args.url };
      if (args.name) params.title = args.name;

      const result = await metaRequest<{ id: string }>({
        method: 'POST',
        path: `/${accountId}/advideos`,
        params,
      });

      const videoId = result.id;

      // Poll encoding status
      let status = 'processing';
      let attempts = 0;
      const maxAttempts = 30;

      while (status === 'processing' && attempts < maxAttempts) {
        await sleep(5000);
        attempts++;
        const video = await metaRequest<{ status: { video_status: string } }>({
          path: `/${videoId}`,
          params: { fields: 'status' },
        });
        status = video.status?.video_status ?? 'unknown';
      }

      return JSON.stringify({
        message: status === 'ready' ? 'Vídeo enviado e processado com sucesso' : `Vídeo enviado (status: ${status})`,
        video_id: videoId,
        encoding_status: status,
      }, null, 2);
    }

    case 'get_ad_image': {
      const result = await metaRequest<{ data: Array<Record<string, unknown>> }>({
        path: `/${accountId}/adimages`,
        params: { hashes: JSON.stringify([args.image_hash]), fields: 'hash,name,url,width,height,status' },
      });
      const image = result.data?.[0];
      if (!image) return JSON.stringify({ error: 'Imagem não encontrada' }, null, 2);
      return JSON.stringify(image, null, 2);
    }

    case 'get_ad_video': {
      const result = await metaRequest({
        path: `/${args.video_id}`,
        params: { fields: 'id,title,description,length,status,picture,created_time' },
      });
      return JSON.stringify(result, null, 2);
    }

    default:
      throw new Error(`Unknown media tool: ${name}`);
  }
}
