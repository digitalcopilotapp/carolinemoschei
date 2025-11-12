#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BrevoApi } from "@getbrevo/brevo";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Brevo API client
const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("BREVO_API_KEY environment variable is required");
  process.exit(1);
}

const brevoClient = new BrevoApi.ApiClient();
brevoClient.authentications["api-key"].apiKey = apiKey;

// Initialize MCP Server
const server = new Server(
  {
    name: "brevo-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "brevo_get_contacts",
        description: "Get contacts from Brevo. Supports filtering by email, list ID, and pagination.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of contacts to retrieve (default: 50, max: 1000)",
              default: 50,
            },
            offset: {
              type: "number",
              description: "Offset for pagination (default: 0)",
              default: 0,
            },
            email: {
              type: "string",
              description: "Filter by email address",
            },
            listId: {
              type: "number",
              description: "Filter by list ID",
            },
          },
        },
      },
      {
        name: "brevo_create_contact",
        description: "Create a new contact in Brevo",
        inputSchema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "Contact email address (required)",
            },
            attributes: {
              type: "object",
              description: "Contact attributes (FIRSTNAME, LASTNAME, SMS, etc.)",
            },
            listIds: {
              type: "array",
              items: { type: "number" },
              description: "List IDs to add contact to",
            },
            updateEnabled: {
              type: "boolean",
              description: "Update contact if already exists (default: true)",
              default: true,
            },
          },
          required: ["email"],
        },
      },
      {
        name: "brevo_update_contact",
        description: "Update an existing contact in Brevo",
        inputSchema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "Contact email address (required)",
            },
            attributes: {
              type: "object",
              description: "Contact attributes to update",
            },
            listIds: {
              type: "array",
              items: { type: "number" },
              description: "List IDs to add contact to",
            },
            unlinkListIds: {
              type: "array",
              items: { type: "number" },
              description: "List IDs to remove contact from",
            },
          },
          required: ["email"],
        },
      },
      {
        name: "brevo_delete_contact",
        description: "Delete a contact from Brevo",
        inputSchema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "Contact email address (required)",
            },
          },
          required: ["email"],
        },
      },
      {
        name: "brevo_get_lists",
        description: "Get all contact lists from Brevo",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of lists to retrieve (default: 50)",
              default: 50,
            },
            offset: {
              type: "number",
              description: "Offset for pagination (default: 0)",
              default: 0,
            },
          },
        },
      },
      {
        name: "brevo_create_list",
        description: "Create a new contact list in Brevo",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "List name (required)",
            },
            folderId: {
              type: "number",
              description: "Folder ID to place list in",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "brevo_get_campaigns",
        description: "Get email campaigns from Brevo",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["classic", "trigger"],
              description: "Campaign type",
            },
            status: {
              type: "string",
              enum: ["draft", "sent", "archive", "queued", "suspended", "in_process"],
              description: "Campaign status",
            },
            limit: {
              type: "number",
              description: "Number of campaigns to retrieve (default: 50)",
              default: 50,
            },
            offset: {
              type: "number",
              description: "Offset for pagination (default: 0)",
              default: 0,
            },
          },
        },
      },
      {
        name: "brevo_create_campaign",
        description: "Create a new email campaign in Brevo",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Campaign name (required)",
            },
            subject: {
              type: "string",
              description: "Email subject (required)",
            },
            htmlContent: {
              type: "string",
              description: "HTML content of the email (required)",
            },
            sender: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
              description: "Sender information (required)",
            },
            recipients: {
              type: "object",
              properties: {
                listIds: {
                  type: "array",
                  items: { type: "number" },
                },
              },
              description: "Recipients configuration",
            },
            scheduledAt: {
              type: "string",
              description: "Schedule date (ISO 8601 format)",
            },
          },
          required: ["name", "subject", "htmlContent", "sender"],
        },
      },
      {
        name: "brevo_send_transactional_email",
        description: "Send a transactional email via Brevo",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  name: { type: "string" },
                },
              },
              description: "Recipients (required)",
            },
            subject: {
              type: "string",
              description: "Email subject (required)",
            },
            htmlContent: {
              type: "string",
              description: "HTML content of the email",
            },
            textContent: {
              type: "string",
              description: "Plain text content of the email",
            },
            sender: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
              description: "Sender information (required)",
            },
            params: {
              type: "object",
              description: "Template parameters",
            },
            templateId: {
              type: "number",
              description: "Template ID to use",
            },
            attachment: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  content: { type: "string" },
                },
              },
              description: "Email attachments",
            },
          },
          required: ["to", "subject", "sender"],
        },
      },
      {
        name: "brevo_get_account",
        description: "Get Brevo account information",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "brevo_get_smtp_templates",
        description: "Get SMTP email templates from Brevo",
        inputSchema: {
          type: "object",
          properties: {
            templateStatus: {
              type: "boolean",
              description: "Filter by template status",
            },
            limit: {
              type: "number",
              description: "Number of templates to retrieve (default: 50)",
              default: 50,
            },
            offset: {
              type: "number",
              description: "Offset for pagination (default: 0)",
              default: 0,
            },
          },
        },
      },
      {
        name: "brevo_get_webhooks",
        description: "Get webhooks configured in Brevo",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["transactional", "marketing", "inbound"],
              description: "Webhook type",
            },
          },
        },
      },
      {
        name: "brevo_create_webhook",
        description: "Create a new webhook in Brevo",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Webhook URL (required)",
            },
            description: {
              type: "string",
              description: "Webhook description",
            },
            events: {
              type: "array",
              items: { type: "string" },
              description: "Events to listen for (required)",
            },
            type: {
              type: "string",
              enum: ["transactional", "marketing", "inbound"],
              description: "Webhook type (required)",
            },
          },
          required: ["url", "events", "type"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "brevo_get_contacts": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const params = {
          limit: args.limit || 50,
          offset: args.offset || 0,
        };
        if (args.email) params.email = args.email;
        if (args.listId) params.listIds = [args.listId];

        const response = await contactsApi.getContacts(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_create_contact": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const createContact = new BrevoApi.CreateContact();
        createContact.email = args.email;
        if (args.attributes) createContact.attributes = args.attributes;
        if (args.listIds) createContact.listIds = args.listIds;
        createContact.updateEnabled = args.updateEnabled !== false;

        const response = await contactsApi.createContact(createContact);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_update_contact": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const updateContact = new BrevoApi.UpdateContact();
        if (args.attributes) updateContact.attributes = args.attributes;
        if (args.listIds) updateContact.listIds = args.listIds;
        if (args.unlinkListIds) updateContact.unlinkListIds = args.unlinkListIds;

        const response = await contactsApi.updateContact(args.email, updateContact);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_delete_contact": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        await contactsApi.deleteContact(args.email);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Contact deleted" }, null, 2),
            },
          ],
        };
      }

      case "brevo_get_lists": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const params = {
          limit: args.limit || 50,
          offset: args.offset || 0,
        };

        const response = await contactsApi.getLists(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_create_list": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const createList = new BrevoApi.CreateList();
        createList.name = args.name;
        if (args.folderId) createList.folderId = args.folderId;

        const response = await contactsApi.createList(createList);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_get_campaigns": {
        const emailCampaignsApi = new BrevoApi.EmailCampaignsApi(brevoClient);
        const params = {
          limit: args.limit || 50,
          offset: args.offset || 0,
        };
        if (args.type) params.type = args.type;
        if (args.status) params.status = args.status;

        const response = await emailCampaignsApi.getEmailCampaigns(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_create_campaign": {
        const emailCampaignsApi = new BrevoApi.EmailCampaignsApi(brevoClient);
        const createCampaign = new BrevoApi.CreateEmailCampaign();
        createCampaign.name = args.name;
        createCampaign.subject = args.subject;
        createCampaign.htmlContent = args.htmlContent;
        createCampaign.sender = args.sender;
        if (args.recipients) createCampaign.recipients = args.recipients;
        if (args.scheduledAt) createCampaign.scheduledAt = args.scheduledAt;

        const response = await emailCampaignsApi.createEmailCampaign(createCampaign);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_send_transactional_email": {
        const transactionalEmailsApi = new BrevoApi.TransactionalEmailsApi(brevoClient);
        const sendSmtpEmail = new BrevoApi.SendSmtpEmail();
        sendSmtpEmail.to = args.to;
        sendSmtpEmail.subject = args.subject;
        sendSmtpEmail.sender = args.sender;
        if (args.htmlContent) sendSmtpEmail.htmlContent = args.htmlContent;
        if (args.textContent) sendSmtpEmail.textContent = args.textContent;
        if (args.params) sendSmtpEmail.params = args.params;
        if (args.templateId) sendSmtpEmail.templateId = args.templateId;
        if (args.attachment) sendSmtpEmail.attachment = args.attachment;

        const response = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_get_account": {
        const accountApi = new BrevoApi.AccountApi(brevoClient);
        const response = await accountApi.getAccount();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_get_smtp_templates": {
        const transactionalEmailsApi = new BrevoApi.TransactionalEmailsApi(brevoClient);
        const params = {
          limit: args.limit || 50,
          offset: args.offset || 0,
        };
        if (args.templateStatus !== undefined) params.templateStatus = args.templateStatus;

        const response = await transactionalEmailsApi.getSmtpTemplates(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_get_webhooks": {
        const webhooksApi = new BrevoApi.WebhooksApi(brevoClient);
        const params = {};
        if (args.type) params.type = args.type;

        const response = await webhooksApi.getWebhooks(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo_create_webhook": {
        const webhooksApi = new BrevoApi.WebhooksApi(brevoClient);
        const createWebhook = new BrevoApi.CreateWebhook();
        createWebhook.url = args.url;
        createWebhook.description = args.description || "";
        createWebhook.events = args.events;
        createWebhook.type = args.type;

        const response = await webhooksApi.createWebhook(createWebhook);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: error.message,
              details: error.response?.body || error.stack,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "brevo://account",
        name: "Brevo Account Information",
        description: "Get account information and statistics",
        mimeType: "application/json",
      },
      {
        uri: "brevo://contacts",
        name: "Brevo Contacts",
        description: "List of all contacts",
        mimeType: "application/json",
      },
      {
        uri: "brevo://lists",
        name: "Brevo Contact Lists",
        description: "List of all contact lists",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle resource requests
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case "brevo://account": {
        const accountApi = new BrevoApi.AccountApi(brevoClient);
        const response = await accountApi.getAccount();
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo://contacts": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const response = await contactsApi.getContacts({ limit: 100 });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      case "brevo://lists": {
        const contactsApi = new BrevoApi.ContactsApi(brevoClient);
        const response = await contactsApi.getLists({ limit: 100 });
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(response.body, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Brevo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
