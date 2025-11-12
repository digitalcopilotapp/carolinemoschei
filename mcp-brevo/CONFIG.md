# Configuração do Brevo MCP Server

## Passo a Passo para Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar API Key

1. Obtenha sua API key do Brevo em: https://app.brevo.com/settings/keys/api
2. Crie um arquivo `.env` na raiz do projeto:
```bash
cp .env.example .env
```
3. Edite o arquivo `.env` e adicione sua API key:
```
BREVO_API_KEY=sua_api_key_aqui
```

### 3. Configurar no Cursor

O Cursor precisa ser configurado para usar o servidor MCP. A configuração varia dependendo de onde você está usando o Cursor:

#### Opção 1: Configuração via Arquivo de Configuração do MCP

Localize o arquivo de configuração do MCP do Cursor (geralmente em `~/.cursor/mcp.json` ou similar) e adicione:

```json
{
  "mcpServers": {
    "brevo": {
      "command": "node",
      "args": ["/Users/nbuenobrg/carolinemoschei/mcp-brevo/index.js"],
      "env": {
        "BREVO_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

#### Opção 2: Configuração via Variável de Ambiente

Se preferir usar variáveis de ambiente do sistema:

```json
{
  "mcpServers": {
    "brevo": {
      "command": "node",
      "args": ["/Users/nbuenobrg/carolinemoschei/mcp-brevo/index.js"]
    }
  }
}
```

E defina `BREVO_API_KEY` nas variáveis de ambiente do sistema ou no arquivo `.env`.

### 4. Reiniciar o Cursor

Após configurar, reinicie o Cursor para que as mudanças tenham efeito.

### 5. Verificar Instalação

Após reiniciar, você deve ver o servidor MCP Brevo disponível nas ferramentas do Cursor. Você pode testar usando:

- `brevo_get_account` - Para verificar se a API key está funcionando
- `brevo_get_contacts` - Para listar contatos

## Ferramentas Disponíveis

### Contatos
- `brevo_get_contacts` - Listar contatos
- `brevo_create_contact` - Criar contato
- `brevo_update_contact` - Atualizar contato
- `brevo_delete_contact` - Deletar contato

### Listas
- `brevo_get_lists` - Listar listas
- `brevo_create_list` - Criar lista

### Campanhas
- `brevo_get_campaigns` - Listar campanhas
- `brevo_create_campaign` - Criar campanha

### Emails Transacionais
- `brevo_send_transactional_email` - Enviar email transacional
- `brevo_get_smtp_templates` - Listar templates SMTP

### Webhooks
- `brevo_get_webhooks` - Listar webhooks
- `brevo_create_webhook` - Criar webhook

### Conta
- `brevo_get_account` - Informações da conta

## Recursos Disponíveis

- `brevo://account` - Informações da conta
- `brevo://contacts` - Lista de contatos
- `brevo://lists` - Lista de listas

## Troubleshooting

### Erro: "BREVO_API_KEY environment variable is required"
- Verifique se o arquivo `.env` existe e contém a API key
- Verifique se a API key está correta
- Certifique-se de que o arquivo `.env` está na raiz do projeto

### Erro: "Cannot find module"
- Execute `npm install` para instalar as dependências
- Verifique se o Node.js está instalado: `node --version`

### Servidor MCP não aparece no Cursor
- Verifique se o caminho no arquivo de configuração está correto
- Reinicie o Cursor completamente
- Verifique os logs do Cursor para erros

## Documentação Adicional

- [Documentação da API Brevo](https://developers.brevo.com/)
- [SDK Brevo para Node.js](https://github.com/getbrevo/brevo-nodejs)
- [Documentação do MCP](https://modelcontextprotocol.io/)
