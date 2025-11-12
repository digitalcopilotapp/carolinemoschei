# MCP V0 Server

Servidor MCP (Model Context Protocol) para integração com o V0 App.

## Instalação

```bash
npm install
npm run build
```

## Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Preencha `V0_API_KEY` no arquivo `.env` com sua chave de API do V0.

## Uso

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## Configuração no Cursor IDE

Adicione ao arquivo `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "v0": {
      "command": "node",
      "args": ["/caminho/absoluto/para/mcp-v0/dist/server.js"],
      "env": {
        "V0_API_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

Ou use variáveis de ambiente do sistema (recomendado):

```json
{
  "mcpServers": {
    "v0": {
      "command": "node",
      "args": ["/caminho/absoluto/para/mcp-v0/dist/server.js"]
    }
  }
}
```

Reinicie o Cursor após configurar.

## Ferramentas Disponíveis

- `v0.generate`: Gera código usando o V0 App baseado em um prompt de texto.







