# Plano de Testes MCP V0

## Smoke tests
- `npm install` dentro de `mcp-v0`
- `npm run build`
- `node dist/server.js --stdio --help` (espera banner e lista de ferramentas)

## Testes funcionais
1. Executar servidor: `npm run dev`
2. Usar cliente MCP (`npx @modelcontextprotocol/cli call v0.generate --prompt "Crie um componente"`)
3. Validar que a resposta contém JSON com campos `code` ou `choices`

## Métricas observadas
- Latência da requisição ao endpoint `https://mcp.v0.dev/generate`
- Status HTTP e payload retornado
- Logs de erro (HTTP >= 400)

## Casos negativos
- Ausência do `V0_API_KEY` deve retornar erro explícito
- Prompt vazio deve falhar com validação local
