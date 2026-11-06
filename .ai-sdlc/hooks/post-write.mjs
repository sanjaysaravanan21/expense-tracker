#!/usr/bin/env node
// PostToolUse: quick lint of the file that was just written. Skips silently until eslint is installed.
// Exit 2 + stderr feeds the failure back to Claude Code; other tools ignore post-hook output.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { relative, resolve, isAbsolute } from 'node:path';
import { normalize, repoRoot } from './guard.mjs';

const lintable = /\.(?:[cm]?[jt]sx?)$/;

async function readStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const n = normalize(JSON.parse(await readStdin()));
    if (n.kind !== 'write') process.exit(0);
    const eslint = resolve(repoRoot, 'node_modules/.bin/eslint');
    if (!existsSync(eslint)) process.exit(0);

    const files = n.paths
      .map((p) => (isAbsolute(p) ? p : resolve(n.cwd, p)))
      .filter((abs) => lintable.test(abs) && existsSync(abs) && !relative(repoRoot, abs).startsWith('..'));
    if (files.length === 0) process.exit(0);

    const result = spawnSync(eslint, ['--no-warn-ignored', ...files], { cwd: repoRoot, encoding: 'utf8', timeout: 60_000 });
    if (result.status !== 0) {
      process.stderr.write(`Lint failed after write:\n${result.stdout}${result.stderr}`);
      process.exitCode = 2;
    }
  } catch (error) {
    process.stderr.write(`ai-sdlc post-write hook error: ${error.message}\n`);
  }
}
