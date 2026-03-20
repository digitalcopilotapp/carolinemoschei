import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = process.env.AUDIT_LOG_DIR || './logs';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

export interface AuditEntry {
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  parameters?: Record<string, unknown>;
  result?: string;
  level: 'read' | 'write';
}

export const auditTools: Tool[] = [
  {
    name: 'get_audit_log',
    description: 'Consulta logs de auditoria com filtros',
    inputSchema: {
      type: 'object',
      properties: {
        action_type: { type: 'string', description: 'Filtrar por ação (ex: create_campaign)' },
        resource_type: { type: 'string', description: 'Filtrar por tipo de recurso' },
        since: { type: 'string', description: 'Data início (YYYY-MM-DD)' },
        until: { type: 'string', description: 'Data fim (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Limite (padrão: 50)' },
      },
    },
  },
  {
    name: 'export_audit_log',
    description: 'Exporta logs de auditoria em JSON ou CSV',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string' },
        until: { type: 'string' },
        format: { type: 'string', enum: ['json', 'csv'], description: 'Formato (padrão: json)' },
      },
    },
  },
];

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getCurrentLogFile(): string {
  ensureLogDir();
  const current = path.join(LOG_DIR, 'audit.log');
  if (fs.existsSync(current)) {
    const stats = fs.statSync(current);
    if (stats.size >= MAX_FILE_SIZE) rotateLog(current);
  }
  return current;
}

function rotateLog(currentFile: string) {
  for (let i = MAX_FILES - 1; i >= 1; i--) {
    const from = path.join(LOG_DIR, `audit.${i}.log`);
    const to = path.join(LOG_DIR, `audit.${i + 1}.log`);
    if (fs.existsSync(from)) {
      if (i + 1 >= MAX_FILES) fs.unlinkSync(from);
      else fs.renameSync(from, to);
    }
  }
  fs.renameSync(currentFile, path.join(LOG_DIR, 'audit.1.log'));
}

function sanitizeParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const safe = { ...params };
  for (const key of Object.keys(safe)) {
    const lower = key.toLowerCase();
    if (lower.includes('token') || lower.includes('secret') || lower.includes('password')) {
      safe[key] = '[REDACTED]';
    }
  }
  return safe;
}

export function logAudit(entry: AuditEntry) {
  const logFile = getCurrentLogFile();
  const sanitized = { ...entry, parameters: sanitizeParams(entry.parameters) };
  fs.appendFileSync(logFile, JSON.stringify(sanitized) + '\n', 'utf-8');
}

function readAllEntries(): AuditEntry[] {
  ensureLogDir();
  const entries: AuditEntry[] = [];
  const files = ['audit.log', ...Array.from({ length: MAX_FILES }, (_, i) => `audit.${i + 1}.log`)];
  for (const file of files) {
    const filePath = path.join(LOG_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try { entries.push(JSON.parse(line) as AuditEntry); } catch { /* skip */ }
    }
  }
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function handleAuditTool(name: string, args: Record<string, unknown>): Promise<string> {
  let filtered = readAllEntries();
  if (args.action_type) filtered = filtered.filter((e) => e.action === args.action_type);
  if (args.resource_type) filtered = filtered.filter((e) => e.resourceType === args.resource_type);
  if (args.since) filtered = filtered.filter((e) => e.timestamp >= (args.since as string));
  if (args.until) filtered = filtered.filter((e) => e.timestamp <= (args.until as string) + 'T23:59:59');
  filtered = filtered.slice(0, (args.limit as number) || 50);

  if (name === 'export_audit_log' && (args.format as string) === 'csv') {
    const header = 'timestamp,action,resourceType,resourceId,level\n';
    const rows = filtered.map((e) => `${e.timestamp},${e.action},${e.resourceType},${e.resourceId || ''},${e.level}`).join('\n');
    return header + rows;
  }

  return JSON.stringify(filtered, null, 2);
}
