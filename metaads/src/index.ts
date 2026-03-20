import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { authenticateWithSystemToken } from './auth/index.js';

async function main() {
  // Try to authenticate on startup if token is available
  if (process.env.META_SYSTEM_USER_TOKEN) {
    try {
      const user = await authenticateWithSystemToken();
      process.stderr.write(
        `[meta-ads] Autenticado como: ${user.name} (${user.id})\n`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      process.stderr.write(`[meta-ads] Aviso: falha na autenticação — ${msg}\n`);
    }
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`[meta-ads] Erro fatal: ${error}\n`);
  process.exit(1);
});
