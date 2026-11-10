// Work budget (token proxy) for a story: tool calls and estimated KB read into context.
// Hooks cannot see real tokens, so calls and file sizes are the enforceable proxy. State: config.budgetFile (git-ignored).
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

const DEFAULTS = {
  maxToolCalls: 150, toolCallExtension: 50, toolCallCeiling: 300,
  maxOutputKB: 600, outputExtensionKB: 200, outputCeilingKB: 1200,
  maxFileReadKB: 40, defaultCallKB: 2, rangedReadKB: 4,
  stageToolCalls: { 'pm-analyst': 30, developer: 100, reviewer: 40 },
};

export const budgetOf = (config) => ({ ...DEFAULTS, ...config.budget });
const stateFile = (config, root) => resolve(root, config.budgetFile ?? '.ai-sdlc/state/budget.json');
const emptyState = () => ({ calls: 0, outputKB: 0, extraCalls: 0, extraKB: 0, stageExtra: 0, stage: null, stageCalls: {} });

export function readBudget(config, root) {
  const file = stateFile(config, root);
  if (!existsSync(file)) return emptyState();
  try {
    return { ...emptyState(), ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return emptyState();
  }
}

export function writeBudget(config, root, state) {
  const file = stateFile(config, root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
}

export const resetBudget = (config, root) => rmSync(stateFile(config, root), { force: true });

export const allowedCalls = (s, b) => Math.min(b.maxToolCalls + s.extraCalls, b.toolCallCeiling);
export const allowedKB = (s, b) => Math.min(b.maxOutputKB + s.extraKB, b.outputCeilingKB);
export const stageAllowed = (s, b) => (s.stage && b.stageToolCalls[s.stage] != null ? b.stageToolCalls[s.stage] + s.stageExtra : null);

const RANGE_KEYS = ['view_range', 'viewrange', 'offset', 'limit', 'startline', 'endline', 'start_line', 'end_line'];

// Rough KB a tool call adds to the context. Full reads of a file cost its size; everything else a flat estimate.
export function estimateKB(input, kind, b, root, cwd) {
  if (kind !== 'read' || !input || typeof input !== 'object') return b.defaultCallKB;
  const keys = Object.keys(input).map((k) => k.toLowerCase());
  const target = ['path', 'file_path', 'filepath', 'file', 'filename'].map((k) => input[k]).find((v) => typeof v === 'string');
  if (!target) return b.defaultCallKB;
  if (RANGE_KEYS.some((k) => keys.includes(k))) return b.rangedReadKB;
  try {
    const abs = isAbsolute(target) ? target : resolve(cwd ?? root, target);
    const st = statSync(abs);
    return st.isFile() ? Math.ceil(st.size / 1024) : b.defaultCallKB;
  } catch {
    return b.defaultCallKB;
  }
}

// 'allow' | 'ask' | 'deny'
export function evaluateBudget(s, b) {
  const over = [];
  let level = 'allow';
  const raise = (to, msg) => {
    over.push(msg);
    if (to === 'deny' || level === 'allow') level = to;
  };
  if (s.calls >= b.toolCallCeiling) raise('deny', `${s.calls} tool calls reached the hard ceiling ${b.toolCallCeiling}.`);
  else if (s.calls >= allowedCalls(s, b)) raise('ask', `${s.calls} tool calls reached the limit ${allowedCalls(s, b)}.`);
  if (s.outputKB >= b.outputCeilingKB) raise('deny', `~${s.outputKB} KB read into context reached the hard ceiling ${b.outputCeilingKB} KB.`);
  else if (s.outputKB >= allowedKB(s, b)) raise('ask', `~${s.outputKB} KB read into context reached the limit ${allowedKB(s, b)} KB.`);
  const cap = stageAllowed(s, b);
  if (cap != null && (s.stageCalls[s.stage] ?? 0) >= cap) raise('ask', `Stage "${s.stage}" used ${s.stageCalls[s.stage]} tool calls (stage budget ${cap}).`);
  if (level === 'allow') return { permission: 'allow' };
  const next = level === 'deny'
    ? 'Stop, summarise progress and what remains, and hand over to the user.'
    : 'Stop, summarise progress and what remains, and ask the user whether to approve more budget (they run `npm run ai:budget -- extend`).';
  return { permission: level, reason: `Work budget reached. ${over.join(' ')} ${next}` };
}

export function extendBudget(s, b) {
  s.extraCalls = Math.min(s.extraCalls + b.toolCallExtension, b.toolCallCeiling - b.maxToolCalls);
  s.extraKB = Math.min(s.extraKB + b.outputExtensionKB, b.outputCeilingKB - b.maxOutputKB);
  s.stageExtra += b.toolCallExtension;
  return s;
}

export function setStage(s, stage) {
  s.stage = stage || null;
  return s;
}

// Commands that manage the budget itself must stay reachable so the agent can report status.
const exempt = (command) => typeof command === 'string' && /\bai:budget\b[^;\n]*\bstatus\b|budget\.mjs\s+status\b/.test(command);

// Called by the guard for every tool call that was otherwise allowed. Counts the call and applies the budget.
export function budgetStep(n, config, root) {
  const b = budgetOf(config);
  const s = readBudget(config, root);
  // Only a story run is budgeted: it starts with `ai:budget -- stage <name>` or a scope file, so ad-hoc work is never counted.
  if (!s.stage && !existsSync(resolve(root, config.scopeFile))) return { permission: 'allow' };
  const gate = evaluateBudget(s, b);
  if (gate.permission !== 'allow' && !exempt(n.command)) return gate;

  const kb = estimateKB(n.input, n.kind, b, root, n.cwd);
  const ranged = n.kind === 'read' && kb === b.rangedReadKB;
  if (n.kind === 'read' && !ranged && kb > b.maxFileReadKB) {
    return { permission: 'ask', reason: `Reading ~${kb} KB at once exceeds ${b.maxFileReadKB} KB. Read a section with view_range, or search first.` };
  }
  s.calls += 1;
  s.outputKB += kb;
  if (s.stage) s.stageCalls[s.stage] = (s.stageCalls[s.stage] ?? 0) + 1;
  writeBudget(config, root, s);
  return { permission: 'allow' };
}
