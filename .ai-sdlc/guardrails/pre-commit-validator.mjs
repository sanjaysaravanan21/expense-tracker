#!/usr/bin/env node
// Post-flight guardrail, run from .husky/pre-commit (and available as `npm run ai:validate`).
// Checks staged changes for: sensitive files, hardcoded secrets in added lines, files outside the story scope.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig, repoRoot, isSensitivePath, readScope, inScope } from '../hooks/guard.mjs';

const git = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

export function validate({ files, addedLines, config = loadConfig(), scope = readScope(config, repoRoot) }) {
  const problems = [];
  for (const f of files) {
    if (isSensitivePath(f, config)) problems.push(`Sensitive file staged: ${f}`);
    if (scope && !inScope(f, scope.allowed)) problems.push(`Outside story scope (${scope.story}): ${f}`);
  }
  const patterns = config.secretPatterns.map((p) => ({ name: p.name, re: new RegExp(p.pattern, 'i') }));
  for (const { file, line, text } of addedLines) {
    if (/ai-sdlc-allow-secret/.test(text)) continue;
    for (const { name, re } of patterns) {
      if (re.test(text)) problems.push(`Possible secret (${name}) at ${file}:${line}`);
    }
  }
  return problems;
}

export function parseAddedLines(diff) {
  const out = [];
  let file = '';
  let line = 0;
  for (const row of diff.split('\n')) {
    if (row.startsWith('+++ b/')) file = row.slice(6);
    else if (row.startsWith('@@')) line = Number(/\+(\d+)/.exec(row)?.[1] ?? 0) - 1;
    else if (row.startsWith('+') && !row.startsWith('+++')) out.push({ file, line: ++line, text: row.slice(1) });
    else if (!row.startsWith('-')) line++;
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n').filter(Boolean);
  if (files.length === 0) process.exit(0);
  const problems = validate({ files, addedLines: parseAddedLines(git('diff', '--cached', '-U0', '--no-color')) });
  if (problems.length) {
    console.error(`ai-sdlc pre-commit validation failed:\n- ${problems.join('\n- ')}`);
    console.error('\nFalse positive on a secret check? Append "ai-sdlc-allow-secret" in a comment on that line.');
    process.exit(1);
  }
}
