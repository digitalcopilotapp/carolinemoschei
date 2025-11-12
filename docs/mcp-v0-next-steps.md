# Próximos Passos & Checklist MCP V0

## Quando houver conector oficial
- Substituir dependência local por pacote `@modelcontextprotocol/v0` (se publicado)
- Atualizar comando no `cursor-mcp-config` para usar pacote oficial

## Checklist de instalação manual
- [ ] Clonar/puxar diretório `mcp-v0`
- [ ] Executar `npm install`
- [ ] Duplicar `.env.example` para `.env`
- [ ] Preencher `V0_API_KEY`
- [ ] Rodar `npm run build`
- [ ] Registrar servidor no Cursor: 
  - `~/.cursor/mcp.json` → adicionar entrada `"v0": { "command": "node", "args": ["/caminho/mcp-v0/dist/server.js"] }`
- [ ] Reiniciar Cursor IDE

## Considerações adicionais
- Avaliar uso de caching de prompts/respostas
- Monitorar limite de rate da API V0
- Implementar métricas de observabilidade (logs estruturados, tracing)
