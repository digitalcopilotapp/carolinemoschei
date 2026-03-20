import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { onRateLimitHeaders } from './utils/meta-client.js';
import { rateLimiter } from './rate-limiter/index.js';
import { accountTools, handleAccountTool } from './tools/accounts.js';
import { campaignTools, handleCampaignTool } from './tools/campaigns.js';

export function createServer() {
  // Wire rate limiter to receive headers from every API call
  onRateLimitHeaders((headers) => rateLimiter.updateFromHeaders(headers));

  const server = new Server(
    {
      name: 'meta-ads',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const rateLimitTool = {
    name: 'get_rate_limit_status',
    description: 'Exibe o uso atual dos limites de rate limiting da Meta API',
    inputSchema: { type: 'object' as const, properties: {} },
  };

  const allTools = [rateLimitTool, ...accountTools, ...campaignTools];

  const accountToolNames = new Set(accountTools.map((t) => t.name));
  const campaignToolNames = new Set(campaignTools.map((t) => t.name));

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args ?? {}) as Record<string, unknown>;

    try {
      let result: string;

      if (name === 'get_rate_limit_status') {
        result = JSON.stringify(rateLimiter.getStatus(), null, 2);
      } else if (accountToolNames.has(name)) {
        result = await handleAccountTool(name, toolArgs);
      } else if (campaignToolNames.has(name)) {
        result = await handleCampaignTool(name, toolArgs);
      } else {
        throw new Error(`Ferramenta desconhecida: ${name}`);
      }

      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        content: [{ type: 'text', text: `Erro: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}
