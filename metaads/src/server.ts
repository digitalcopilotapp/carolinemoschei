import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { onRateLimitHeaders } from './utils/meta-client.js';
import { rateLimiter } from './rate-limiter/index.js';
import { accountTools, handleAccountTool } from './tools/accounts.js';
import { campaignTools, handleCampaignTool } from './tools/campaigns.js';
import { adsetTools, handleAdsetTool } from './tools/adsets.js';
import { adTools, handleAdTool } from './tools/ads.js';
import { creativeTools, handleCreativeTool } from './tools/creatives.js';
import { mediaTools, handleMediaTool } from './tools/media.js';
import { audienceTools, handleAudienceTool } from './tools/audiences.js';
import { insightTools, handleInsightTool } from './tools/insights.js';
import { pixelTools, handlePixelTool } from './tools/pixels.js';
import { catalogTools, handleCatalogTool } from './tools/catalogs.js';
import { leadFormTools, handleLeadFormTool } from './tools/lead-forms.js';
import { pageTools, handlePageTool } from './tools/pages.js';
import { validatorTools, handleValidatorTool } from './validators/index.js';
import { auditTools, handleAuditTool } from './audit/index.js';
import { permissionTools, handlePermissionTool } from './permissions/index.js';
import { alertTools, handleAlertTool } from './tools/alerts.js';
import { searchTools, handleSearchTool } from './tools/search.js';
import { budgetTools, handleBudgetTool } from './tools/budget.js';

type ToolHandler = (name: string, args: Record<string, unknown>) => Promise<string>;

export function createServer() {
  onRateLimitHeaders((headers) => rateLimiter.updateFromHeaders(headers));

  const server = new Server(
    { name: 'meta-ads', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  const rateLimitTool = {
    name: 'get_rate_limit_status',
    description: 'Exibe o uso atual dos limites de rate limiting da Meta API',
    inputSchema: { type: 'object' as const, properties: {} },
  };

  // All tool groups
  const toolGroups: Array<{ tools: readonly { name: string }[]; handler: ToolHandler }> = [
    { tools: accountTools, handler: handleAccountTool },
    { tools: campaignTools, handler: handleCampaignTool },
    { tools: adsetTools, handler: handleAdsetTool },
    { tools: adTools, handler: handleAdTool },
    { tools: creativeTools, handler: handleCreativeTool },
    { tools: mediaTools, handler: handleMediaTool },
    { tools: audienceTools, handler: handleAudienceTool },
    { tools: insightTools, handler: handleInsightTool },
    { tools: pixelTools, handler: handlePixelTool },
    { tools: catalogTools, handler: handleCatalogTool },
    { tools: leadFormTools, handler: handleLeadFormTool },
    { tools: pageTools, handler: handlePageTool },
    { tools: validatorTools, handler: handleValidatorTool },
    { tools: auditTools, handler: handleAuditTool },
    { tools: permissionTools, handler: handlePermissionTool },
    { tools: alertTools, handler: handleAlertTool },
    { tools: searchTools, handler: handleSearchTool },
    { tools: budgetTools, handler: handleBudgetTool },
  ];

  const allTools = [rateLimitTool, ...toolGroups.flatMap((g) => g.tools)];
  const dispatch = new Map<string, ToolHandler>();
  for (const { tools, handler } of toolGroups) {
    for (const t of tools) dispatch.set(t.name, handler);
  }

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
      } else {
        const handler = dispatch.get(name);
        if (!handler) throw new Error(`Ferramenta desconhecida: ${name}`);
        result = await handler(name, toolArgs);
      }

      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return { content: [{ type: 'text', text: `Erro: ${message}` }], isError: true };
    }
  });

  return server;
}
