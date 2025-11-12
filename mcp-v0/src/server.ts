import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { fetch } from 'undici';

const V0_ENDPOINT = process.env.V0_ENDPOINT ?? 'https://mcp.v0.dev';
const V0_API_KEY = process.env.V0_API_KEY;

if (!V0_API_KEY) {
  console.warn('[mcp-v0] V0_API_KEY not set; server will refuse requests.');
}

const server = new Server(
  {
    name: 'v0',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'v0.generate',
        description: 'Delegates a prompt to the V0 App code generator',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Prompt to send to V0' }
          },
          required: ['prompt']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  if (!V0_API_KEY) {
    throw new Error('V0_API_KEY is missing');
  }

  const { name, arguments: args } = request.params!;

  if (name !== 'v0.generate') {
    throw new Error(`Unknown tool: ${name}`);
  }

  const prompt = args?.prompt;
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('prompt must be a non-empty string');
  }

  const response = await fetch(`${V0_ENDPOINT}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${V0_API_KEY}`
    },
    body: JSON.stringify({ prompt }),
    signal: extra.signal
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`V0 API error: ${response.status} ${body}`);
  }

  const result = await response.json();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
});

const transport = new StdioServerTransport();
server.connect(transport);
