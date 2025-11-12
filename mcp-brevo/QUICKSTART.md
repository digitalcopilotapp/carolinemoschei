# Quick Start - Brevo MCP Server

## Instalação Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar API Key
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e adicione sua API key do Brevo
# Obtenha em: https://app.brevo.com/settings/keys/api
```

### 3. Configurar no Cursor

Adicione ao arquivo de configuração do MCP do Cursor:

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

### 4. Reiniciar o Cursor

Reinicie o Cursor para carregar o servidor MCP.

## Teste Rápido

Após configurar, teste com:

1. **Verificar conta**: Use `brevo_get_account` para verificar se a API key está funcionando
2. **Listar contatos**: Use `brevo_get_contacts` para ver seus contatos
3. **Criar contato**: Use `brevo_create_contact` para adicionar um novo contato

## Ferramentas Principais

### Contatos
- `brevo_get_contacts` - Listar contatos
- `brevo_create_contact` - Criar contato
- `brevo_update_contact` - Atualizar contato
- `brevo_delete_contact` - Deletar contato

### Emails
- `brevo_send_transactional_email` - Enviar email transacional
- `brevo_create_campaign` - Criar campanha de email

### Listas
- `brevo_get_lists` - Listar listas
- `brevo_create_list` - Criar lista

## Próximos Passos

- Leia o [README.md](./README.md) para documentação completa
- Consulte o [CONFIG.md](./CONFIG.md) para configuração detalhada
- Veja exemplos de uso na documentação da API Brevo
