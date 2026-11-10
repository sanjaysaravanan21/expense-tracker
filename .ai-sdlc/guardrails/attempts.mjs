#!/usr/bin/env node
// Usage: npm run ai:attempts -- run <command...>   run a verification command and count failures
//        npm run ai:attempts -- status             show counters
//        npm run ai:attempts -- extend [--story]   HUMAN approval: grant more attempts (agents must never run this)
//        npm run ai:attempts -- reset              clear all counters
import { spawnSync } from 'node:child_process';
import { loadConfig, repoRoot } from '../hooks/guard.mjs';
import {
  allowedFor, attemptsDecision, extend, limitsOf, readState, recordFailure, recordSuccess, resetState, storyAllowed, writeState,
} from '../hooks/attempts-lib.mjs';

const config = loadConfig();
const lim = limitsOf(config);
const [cmd, ...rest] = process.argv.slice(2);

const tail = (text, n) => text.split('\n').slice(-n).join('\n');

function status() {
  const state = readState(config, repoRoot);
  console.log(`Story attempts: ${state.story}/${storyAllowed(state, lim)} (ceiling ${lim.storyHardCeiling})`);
  for (const e of Object.values(state.failures)) {
    console.log(`- ${e.count}/${allowedFor(e, lim)} (ceiling ${lim.hardCeiling}) ${e.command} :: ${e.error}`);
  }
}

if (cmd === 'run') {
  const argv = rest[0] === '--' ? rest.slice(1) : rest;
  if (argv.length === 0) {
    console.error('usage: attempts run <command...>');
    process.exit(64);
  }
  const gate = attemptsDecision(config, repoRoot);
  if (gate.permission !== 'allow') {
    console.error(`[attempts] BLOCKED. ${gate.reason}`);
    process.exit(3);
  }
  const command = argv.join(' ');
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd: repoRoot,
    // Same minimal environment as test-runner-wrapper.sh: checks never see secrets from the caller's shell.
    env: { HOME: process.env.HOME, PATH: process.env.PATH, CI: '1', NODE_ENV: 'test', TERM: 'dumb' },
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: (lim.testTimeoutSeconds ?? 300) * 1000,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const state = readState(config, repoRoot);
  if (result.status === 0) {
    recordSuccess(state, command);
    writeState(config, repoRoot, state);
    console.log(tail(output, 15));
    console.log('[attempts] passed.');
    process.exit(0);
  }
  const { entry } = recordFailure(state, command, output);
  writeState(config, repoRoot, state);
  console.log(tail(output, 80));
  console.error(`[attempts] FAILED. Same error ${entry.count}/${allowedFor(entry, lim)}; story total ${state.story}/${storyAllowed(state, lim)}.`);
  if (entry.count >= 2) console.error('[attempts] The same error repeated: your hypothesis is wrong, change the approach.');
  const after = attemptsDecision(config, repoRoot);
  if (after.permission !== 'allow') console.error(`[attempts] ${after.reason}`);
  process.exit(result.status ?? 1);
} else if (cmd === 'status') {
  status();
} else if (cmd === 'extend') {
  writeState(config, repoRoot, extend(readState(config, repoRoot), lim, { story: rest.includes('--story') }));
  status();
} else if (cmd === 'reset') {
  resetState(config, repoRoot);
  console.log('Attempt counters cleared.');
} else {
  console.error('usage: attempts <run|status|extend|reset>');
  process.exit(64);
}
