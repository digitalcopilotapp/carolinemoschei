import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';

export type PermissionLevel = 'read_only' | 'manage_campaigns' | 'manage_audiences' | 'full_access';

const WRITE_PREFIXES = ['create_', 'update_', 'delete_', 'duplicate_', 'upload_', 'set_', 'request_'];

interface PermissionConfig {
  accounts: Record<string, PermissionLevel>;
}

const CONFIG_PATH = process.env.PERMISSIONS_CONFIG || './config/permissions.json';

export const permissionTools: Tool[] = [
  {
    name: 'get_account_permissions',
    description: 'Exibe permissões configuradas para a conta ativa',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'set_account_permissions',
    description: 'Define permissões para uma conta de anúncios (requer confirmação)',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string' },
        level: { type: 'string', enum: ['read_only', 'manage_campaigns', 'manage_audiences', 'full_access'] },
        confirm: { type: 'boolean' },
      },
      required: ['account_id', 'level', 'confirm'],
    },
  },
];

function loadConfig(): PermissionConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as PermissionConfig;
  } catch { /* ignore */ }
  return { accounts: {} };
}

function saveConfig(config: PermissionConfig) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function getAccountPermissionLevel(accountId: string): PermissionLevel {
  return loadConfig().accounts[accountId] ?? 'full_access';
}

export function isToolAllowed(accountId: string, toolName: string): boolean {
  const level = getAccountPermissionLevel(accountId);
  if (level === 'full_access') return true;

  const isWrite = WRITE_PREFIXES.some((p) => toolName.startsWith(p));
  if (!isWrite) return true; // Read tools always allowed

  if (level === 'read_only') return false;

  const campaignTools = ['campaign', 'adset', 'ad', 'ad_creative', 'carousel_creative', 'ad_image', 'ad_video', 'budget_schedule'];
  const audienceTools = ['custom_audience', 'lookalike_audience', 'audience'];

  if (level === 'manage_campaigns') {
    return campaignTools.some((t) => toolName.includes(t));
  }
  if (level === 'manage_audiences') {
    return audienceTools.some((t) => toolName.includes(t));
  }

  return false;
}

export async function handlePermissionTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (name === 'get_account_permissions') {
    return JSON.stringify({ defaultLevel: 'full_access', accounts: loadConfig().accounts }, null, 2);
  }

  if (name === 'set_account_permissions') {
    if (!args.confirm) throw new Error('Defina confirm=true para confirmar.');
    const config = loadConfig();
    config.accounts[args.account_id as string] = args.level as PermissionLevel;
    saveConfig(config);
    return JSON.stringify({ message: `Permissões atualizadas para ${args.account_id}`, level: args.level }, null, 2);
  }

  throw new Error(`Unknown permission tool: ${name}`);
}
