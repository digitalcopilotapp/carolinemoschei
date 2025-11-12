# Brevo MCP Server

Servidor MCP (Model Context Protocol) para integração completa com a API do Brevo (anteriormente Sendinblue).

## Funcionalidades

Este servidor MCP fornece acesso total à API do Brevo através de ferramentas e recursos:

### Contatos
- `brevo_get_contacts` - Listar contatos com filtros e paginação
- `brevo_create_contact` - Criar novo contato
- `brevo_update_contact` - Atualizar contato existente
- `brevo_delete_contact` - Deletar contato

### Listas
- `brevo_get_lists` - Listar todas as listas de contatos
- `brevo_create_list` - Criar nova lista de contatos

### Campanhas de Email
- `brevo_get_campaigns` - Listar campanhas de email
- `brevo_create_campaign` - Criar nova campanha de email

### Emails Transacionais
- `brevo_send_transactional_email` - Enviar email transacional
- `brevo_get_smtp_templates` - Listar templates SMTP

### Webhooks
- `brevo_get_webhooks` - Listar webhooks configurados
- `brevo_create_webhook` - Criar novo webhook

### Conta
- `brevo_get_account` - Obter informações da conta

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure a API key do Brevo:
```bash
cp .env.example .env
# Edite o arquivo .env e adicione sua BREVO_API_KEY
```

3. Obtenha sua API key em: https://app.brevo.com/settings/keys/api

## Configuração no Cursor

Para usar este servidor MCP no Cursor, adicione a seguinte configuração no arquivo de configuração do MCP:

```json
{
  "mcpServers": {
    "brevo": {
      "command": "node",
      "args": ["/caminho/para/o/projeto/mcp-brevo/index.js"],
      "env": {
        "BREVO_API_KEY": "sua_api_key_aqui"
      }
    }
  }
}
```

Ou configure via variável de ambiente:

```json
{
  "mcpServers": {
    "brevo": {
      "command": "node",
      "args": ["/caminho/para/o/projeto/mcp-brevo/index.js"]
    }
  }
}
```

E defina `BREVO_API_KEY` no arquivo `.env` ou nas variáveis de ambiente do sistema.

## Uso

Após configurar o servidor MCP, você poderá usar as ferramentas do Brevo diretamente no Cursor:

- Listar contatos
- Criar e gerenciar contatos
- Enviar emails transacionais
- Gerenciar campanhas de email
- Configurar webhooks
- E muito mais!

## Exemplos de Uso

### Criar um contato
```javascript
{
  "tool": "brevo_create_contact",
  "arguments": {
    "email": "exemplo@email.com",
    "attributes": {
      "FIRSTNAME": "João",
      "LASTNAME": "Silva"
    },
    "listIds": [1, 2]
  }
}
```

### Enviar email transacional
```javascript
{
  "tool": "brevo_send_transactional_email",
  "arguments": {
    "to": [{"email": "destinatario@email.com", "name": "Destinatário"}],
    "subject": "Assunto do Email",
    "htmlContent": "<h1>Conteúdo HTML</h1>",
    "sender": {"email": "remetente@email.com", "name": "Remetente"}
  }
}
```

### Listar contatos
```javascript
{
  "tool": "brevo_get_contacts",
  "arguments": {
    "limit": 50,
    "offset": 0
  }
}
```

## Documentação da API Brevo

Para mais informações sobre a API do Brevo, consulte:
https://developers.brevo.com/

## Licença

MIT
