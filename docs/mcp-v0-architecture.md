# Arquitetura Provisória MCP V0

## Autenticação
- Requer `V0_API_KEY` definido no ambiente (já exportado na sessão atual)
- recomendado armazenar via `.env` e carregar com `dotenv`
- Headers HTTP exigem `Authorization: Bearer <token>`

## Inicialização do servidor
- Considerar wrapper `npx mcp-remote https://mcp.v0.dev`
- Para servidor próprio, executar `node mcp-v0/server.js`
- Configuração Cursor: arquivo `~/.cursor/mcp.json` com comando `node` + script local

## Fluxo de execução
1. Carregar variáveis de ambiente
2. Inicializar cliente HTTP apontando para `https://mcp.v0.dev`
3. Registrar handlers MCP (list tools, call tool)
4. Proxies de chamadas: encaminhar prompts/ações via API do V0

## Dependências
- Node.js >= 18
- pacotes: `dotenv`, `node-fetch` (ou `undici`), `@modelcontextprotocol/sdk`
