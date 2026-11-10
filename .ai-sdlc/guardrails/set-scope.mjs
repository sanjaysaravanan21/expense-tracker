#!/usr/bin/env node
// Usage: node .ai-sdlc/guardrails/set-scope.mjs --story "ID or title" <path> [<path>...]
//        node .ai-sdlc/guardrails/set-scope.mjs --clear
// Writes the approved file scope for the current story. Directories end with "/".
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadConfig, repoRoot, isSensitivePath, inScope } from '../hooks/guard.mjs';
import { resetState } from '../hooks/attempts-lib.mjs';
import { resetBudget } from '../hooks/budget-lib.mjs';

const config = loadConfig();
const file = resolve(repoRoot, config.scopeFile);
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  rmSync(file, { force: true });
  resetState(config, repoRoot);
  resetBudget(config, repoRoot);
  console.log('Scope cleared.');
  process.exit(0);
}

const storyIdx = args.indexOf('--story');
const story = storyIdx >= 0 ? args.splice(storyIdx, 2)[1] : 'unnamed';
const allowed = args.map((p) => p.replace(/^\.\//, ''));
const errors = [];
if (allowed.length === 0) errors.push('Provide at least one path.');
for (const p of allowed) {
  if (p.startsWith('/') || p.includes('..')) errors.push(`Path must be repo-relative: ${p}`);
  else if (isSensitivePath(p, config)) errors.push(`Sensitive path cannot be in scope: ${p}`);
  else if (!inScope(p, config.allowedWriteRoots)) errors.push(`Path is outside allowedWriteRoots: ${p}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
mkdirSync(dirname(file), { recursive: true });
// Counters belong to a story. The first scope keeps what analysis already used; a scope extension for the same story
// keeps them too; only switching to a different story starts fresh.
let previousStory = null;
try { previousStory = JSON.parse(readFileSync(file, 'utf8')).story; } catch { /* no previous scope */ }
writeFileSync(file, `${JSON.stringify({ story, allowed, createdAt: new Date().toISOString() }, null, 2)}\n`);
if (previousStory !== null && previousStory !== story) {
  resetState(config, repoRoot);
  resetBudget(config, repoRoot);
}
console.log(`Scope set for "${story}": ${allowed.join(', ')}`);
