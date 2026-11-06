#!/usr/bin/env node
// Universal PreToolUse guard for GitHub Copilot (CLI + VS Code), Claude Code and Cursor.
// Reads the hook payload on stdin, applies .ai-sdlc/config.json, prints a decision in the caller's format.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '..', '..');

export function loadConfig(root = repoRoot) {
  return JSON.parse(readFileSync(resolve(root, '.ai-sdlc/config.json'), 'utf8'));
}

const READ_TOOLS = new Set(['read', 'view', 'grep', 'glob', 'search', 'read_file', 'list_dir']);
const WRITE_TOOLS = new Set(['write', 'edit', 'multiedit', 'delete', 'create', 'apply_patch', 'str_replace_editor', 'notebookedit', 'replace_string_in_file', 'create_file']);
const SHELL_TOOLS = new Set(['bash', 'powershell', 'shell', 'run_in_terminal']);
const PATH_KEYS = new Set(['path', 'file_path', 'filepath', 'file', 'filename', 'target_file', 'notebook_path', 'paths', 'files']);

const blockedCommands = [
  { pattern: /\b(?:curl|wget)\b[^;\n]*\|\s*(?:sudo\s+)?(?:sh|bash|zsh)\b/i, reason: 'Piping a downloaded script into a shell is blocked.' },
  { pattern: /\bbase64\b[^;\n]*\|\s*(?:sudo\s+)?(?:sh|bash|zsh)\b/i, reason: 'Piping an encoded payload into a shell is blocked.' },
  { pattern: /\b(?:mkfs(?:\.[\w-]+)?|wipefs|shred)\b/i, reason: 'Disk formatting or secure deletion commands are blocked.' },
  { pattern: /\bdd\b(?=[^;\n]*\bof=\/dev\/)/i, reason: 'Direct writes to device files are blocked.' },
  { pattern: /\b(?:shutdown|reboot|poweroff)\b/i, reason: 'System shutdown commands are blocked.' },
  { pattern: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/, reason: 'A shell fork bomb pattern is blocked.' },
  { pattern: /\brm\b[^;\n]*\s-[a-z]*(?:rf|fr)[a-z]*\s[^;\n]*(?:\s|^)(?:\/|~|\$HOME)(?:\s|\/|$|\*)/i, reason: 'Recursive forced deletion of a root or home path is blocked.' },
  { pattern: /\bgit\s+push\b[^;\n]*\s(?:--force|-f)\b/i, reason: 'Force-pushing is blocked.' },
  { pattern: /\bgit\s+commit\b[^;\n]*--no-verify\b/i, reason: 'Skipping commit hooks (--no-verify) is blocked.' },
];

const approvalCommands = [
  { pattern: /\b(?:sudo|doas)\b/i, reason: 'Elevated privileges require approval.' },
  { pattern: /\b(?:curl|wget|nc|ncat|netcat)\b/i, reason: 'Network access from a shell command requires approval.' },
  { pattern: /\bgit\s+(?:clean\s+-[^\s]*f|reset\s+--hard)(?:\s|$)/i, reason: 'This destructive Git operation requires approval.' },
  { pattern: /\b(?:bash|sh|zsh|python\d*|ruby|perl)\s+-c\b|\bnode\s+(?:-e|--eval)\b/i, reason: 'Inline code execution requires approval.' },
  { pattern: /\beval\b/i, reason: 'Dynamic shell evaluation requires approval.' },
  { pattern: /\b(?:npm|npx|pnpm|yarn)\s+(?:install|i|add|exec|dlx|publish)\b/i, reason: 'Package installation or execution requires approval.' },
];

const safeCommands = [
  /^(?:pwd|ls|rg|cat|head|tail|wc)(?:\s|$)/i,
  /^git\s+(?:status|diff|log|show|branch|rev-parse)(?:\s|$)/i,
  /^npm\s+(?:run\s+(?:dev|build|preview|test|lint|check-types|ai:[\w:-]+)|test)(?:\s|$)/i,
  /^node\s+(?:--test|--check)(?:\s|$)/i,
];

const envToken = /(?:^|[\\/\s"'`=,:;|&<>()[\]{}])(\.env(?:\.[A-Za-z0-9_-]+)*)(?=$|[\\/\s"'`=,:;|&<>()[\]{}])/gi;

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`);
}

export function isSensitivePath(relPath, config) {
  const base = relPath.split('/').pop() ?? relPath;
  if (config.allowedSensitiveFiles.includes(base)) return false;
  return config.sensitiveFileGlobs.some((g) => globToRegExp(g).test(relPath) || globToRegExp(g).test(base));
}

function commandTouchesSensitive(command, config) {
  envToken.lastIndex = 0;
  for (const m of command.matchAll(envToken)) {
    if (!config.allowedSensitiveFiles.includes(m[1])) return true;
  }
  const ext = config.blockedExtensions.map((e) => e.replace('.', '\\.')).join('|');
  return new RegExp(`\\S+(?:${ext})(?:\\s|$|["'])`, 'i').test(command);
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

function collectPaths(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => collectPaths(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (PATH_KEYS.has(k.toLowerCase())) {
        if (typeof v === 'string') out.push(v);
        else if (Array.isArray(v)) v.filter((x) => typeof x === 'string').forEach((x) => out.push(x));
      } else collectPaths(v, out);
    }
  }
  // apply_patch style payloads carry paths in patch text
  for (const text of collectStrings(value)) {
    for (const m of text.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)) out.push(m[1].trim());
  }
  return out;
}

export function normalize(payload) {
  const raw = payload?.toolArgs ?? payload?.tool_input ?? payload?.input ?? null;
  let input = raw;
  if (typeof raw === 'string') {
    try { input = JSON.parse(raw); } catch { input = { command: raw }; }
  }
  const event = payload?.hook_event_name ?? payload?.hookEventName ?? '';
  const tool = String(payload?.toolName ?? payload?.tool_name ?? '').toLowerCase();

  let format = 'claude';
  if ('toolName' in (payload ?? {})) format = 'copilot';
  if (/^(?:before|after)[A-Z]/.test(event) || (event === 'preToolUse' && 'tool_name' in payload)) format = 'cursor';

  let kind = 'other';
  if (event === 'afterFileEdit') kind = 'write';
  else if (event === 'beforeReadFile' || event === 'beforeTabFileRead') kind = 'read';
  else if (event === 'beforeShellExecution') kind = 'shell';
  else if (READ_TOOLS.has(tool)) kind = 'read';
  else if (WRITE_TOOLS.has(tool)) kind = 'write';
  else if (SHELL_TOOLS.has(tool)) kind = 'shell';

  const command = event === 'beforeShellExecution' ? payload.command : typeof input === 'object' && input ? input.command ?? input.cmd : undefined;
  const paths = collectPaths(input ?? {});
  if (payload?.file_path) paths.push(payload.file_path);
  return { format, event, tool, kind, input, command, paths, cwd: payload?.cwd ?? process.cwd(), attachments: payload?.attachments };
}

export function readScope(config, root) {
  const file = resolve(root, config.scopeFile);
  if (!existsSync(file)) return null;
  const scope = JSON.parse(readFileSync(file, 'utf8'));
  return Array.isArray(scope.allowed) ? scope : null;
}

export function inScope(relPath, allowed) {
  return allowed.some((entry) => (entry.endsWith('/') ? relPath.startsWith(entry) : relPath === entry));
}

function shellDecision(command, config) {
  if (typeof command !== 'string') return { permission: 'deny', reason: 'Unable to inspect this shell command.' };
  if (commandTouchesSensitive(command, config)) return { permission: 'deny', reason: 'Shell access to .env, key or other sensitive files is blocked.' };
  const blocked = blockedCommands.find(({ pattern }) => pattern.test(command));
  if (blocked) return { permission: 'deny', reason: blocked.reason };
  const approval = approvalCommands.find(({ pattern }) => pattern.test(command));
  if (approval) return { permission: 'ask', reason: approval.reason };
  if (/[;&|`$()<>\n]/.test(command)) return { permission: 'ask', reason: 'Shell operators or expansions require review.' };
  if (safeCommands.some((p) => p.test(command.trim()))) return { permission: 'allow' };
  return { permission: 'ask', reason: 'This command is not in the safe-command set.' };
}

export function decide(payload, { root = repoRoot, config = loadConfig(root), env = process.env } = {}) {
  const n = normalize(payload);
  const allow = { permission: 'allow' };

  if (n.kind === 'shell') return shellDecision(n.command, config);
  if (n.kind !== 'read' && n.kind !== 'write') return allow;

  if (n.input == null && n.paths.length === 0) {
    return { permission: 'deny', reason: 'Unable to inspect this file operation.' };
  }
  const paths = [...n.paths, ...collectStrings(n.attachments ?? [])];
  const scope = n.kind === 'write' ? readScope(config, root) : null;

  for (const p of paths) {
    const abs = isAbsolute(p) ? p : resolve(n.cwd, p);
    const rel = relative(root, abs).split('\\').join('/');
    if (rel.startsWith('..')) {
      if (n.kind === 'write') return { permission: 'deny', reason: `Writing outside the repository is blocked: ${p}` };
      continue;
    }
    if (isSensitivePath(rel, config)) {
      return { permission: 'deny', reason: `Access to sensitive file "${rel}" is blocked. Use .env.example for documented variables.` };
    }
    if (n.kind !== 'write') continue;
    if (inScope(rel, config.protectedPaths)) {
      if (env.AI_SDLC_ALLOW_CONFIG_EDIT === '1') continue;
      return { permission: 'deny', reason: `"${rel}" is guardrail/agent config. Edit it manually, or set AI_SDLC_ALLOW_CONFIG_EDIT=1 for a deliberate config change.` };
    }
    if (scope) {
      if (!inScope(rel, scope.allowed)) return { permission: 'deny', reason: `"${rel}" is outside the approved story scope (.ai-sdlc/state/scope.json). Ask the PM/Analyst stage to extend the scope.` };
    } else if (!inScope(rel, config.allowedWriteRoots)) {
      return { permission: 'deny', reason: `"${rel}" is outside the allowed write roots.` };
    }
  }
  return allow;
}

export function format(decision, n) {
  if (n.format === 'cursor') {
    if (decision.permission === 'allow') return { permission: 'allow' };
    return { permission: decision.permission, user_message: decision.reason, agent_message: decision.reason };
  }
  if (decision.permission === 'allow') return {};
  const body = { permissionDecision: decision.permission, permissionDecisionReason: decision.reason };
  return n.format === 'claude'
    ? { ...body, hookSpecificOutput: { hookEventName: 'PreToolUse', ...body } }
    : body;
}

async function readStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const payload = JSON.parse(await readStdin());
    process.stdout.write(`${JSON.stringify(format(decide(payload), normalize(payload)))}\n`);
  } catch (error) {
    process.stderr.write(`ai-sdlc guard failed closed: ${error.message}\n`);
    process.exitCode = 2;
  }
}
