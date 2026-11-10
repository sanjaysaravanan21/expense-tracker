// Attempt budget for the self-healing loop. Pure helpers shared by the guard hook and the attempts CLI.
// State lives in config.attemptsFile (git-ignored). Limits come from config.selfHealing.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULTS = {
  maxAttempts: 3,
  extensionAttempts: 2,
  hardCeiling: 5,
  maxStoryAttempts: 8,
  storyExtensionAttempts: 4,
  storyHardCeiling: 12,
};

export const limitsOf = (config) => ({ ...DEFAULTS, ...config.selfHealing });
const stateFile = (config, root) => resolve(root, config.attemptsFile ?? '.ai-sdlc/state/attempts.json');
const emptyState = () => ({ story: 0, storyExtra: 0, failures: {} });

export function readState(config, root) {
  const file = stateFile(config, root);
  if (!existsSync(file)) return emptyState();
  try {
    return { ...emptyState(), ...JSON.parse(readFileSync(file, 'utf8')) };
  } catch {
    return emptyState();
  }
}

export function writeState(config, root, state) {
  const file = stateFile(config, root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
}

export function resetState(config, root) {
  rmSync(stateFile(config, root), { force: true });
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

// First meaningful error line, normalised so "same error" survives changing numbers and timings.
export function firstErrorLine(output) {
  const lines = output.replace(ANSI, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const line = lines.find((l) => /error|fail|✗|×|ELIFECYCLE/i.test(l)) ?? lines[0] ?? 'unknown failure';
  return line.replace(/\d+/g, '#').replace(/\s+/g, ' ').slice(0, 160);
}

export function signatureOf(command, error) {
  return createHash('sha1').update(`${command}\n${error}`).digest('hex').slice(0, 12);
}

export function recordFailure(state, command, output) {
  const error = firstErrorLine(output);
  const sig = signatureOf(command, error);
  const entry = state.failures[sig] ?? { command, error, count: 0, extra: 0 };
  entry.count += 1;
  state.failures[sig] = entry;
  state.story += 1;
  return { sig, entry };
}

// A passing run resolves every failure recorded for that command; the story total is kept.
export function recordSuccess(state, command) {
  for (const [sig, entry] of Object.entries(state.failures)) {
    if (entry.command === command) delete state.failures[sig];
  }
}

export const allowedFor = (entry, lim) => Math.min(lim.maxAttempts + entry.extra, lim.hardCeiling);
export const storyAllowed = (state, lim) => Math.min(lim.maxStoryAttempts + state.storyExtra, lim.storyHardCeiling);

// 'allow' | 'ask' (needs user approval to continue) | 'deny' (hard ceiling reached).
export function evaluate(state, lim) {
  const reasons = [];
  let level = 'ok';
  const raise = (to, reason) => {
    reasons.push(reason);
    if (to === 'deny' || level === 'ok') level = to;
  };
  for (const entry of Object.values(state.failures)) {
    if (entry.count >= lim.hardCeiling) {
      raise('deny', `"${entry.command}" failed ${entry.count} times with the same error (hard ceiling ${lim.hardCeiling}): ${entry.error}.`);
    } else if (entry.count >= allowedFor(entry, lim)) {
      raise('ask', `"${entry.command}" failed ${entry.count} times with the same error: ${entry.error}.`);
    }
  }
  if (state.story >= lim.storyHardCeiling) {
    raise('deny', `Story total of ${state.story} failed attempts reached the hard ceiling ${lim.storyHardCeiling}.`);
  } else if (state.story >= storyAllowed(state, lim)) {
    raise('ask', `Story total of ${state.story} failed attempts reached its limit ${storyAllowed(state, lim)}.`);
  }
  if (level === 'ok') return { permission: 'allow' };
  const next = level === 'deny'
    ? 'Stop and hand over to the user with a summary of what was tried.'
    : 'Stop, summarise what was tried, and ask the user whether to approve more attempts (they run `npm run ai:attempts -- extend`).';
  return { permission: level, reason: `Attempt limit reached. ${reasons.join(' ')} ${next}` };
}

// Human approval: grant more attempts to every failure at its limit, or to the story total.
export function extend(state, lim, { story = false } = {}) {
  if (story) {
    state.storyExtra = Math.min(state.storyExtra + lim.storyExtensionAttempts, lim.storyHardCeiling - lim.maxStoryAttempts);
    return state;
  }
  for (const entry of Object.values(state.failures)) {
    if (entry.count >= allowedFor(entry, lim)) {
      entry.extra = Math.min(entry.extra + lim.extensionAttempts, lim.hardCeiling - lim.maxAttempts);
    }
  }
  return state;
}

export function attemptsDecision(config, root) {
  return evaluate(readState(config, root), limitsOf(config));
}
