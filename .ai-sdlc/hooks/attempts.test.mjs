import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  evaluate, extend, firstErrorLine, limitsOf, readState, recordFailure, recordSuccess, writeState,
} from './attempts-lib.mjs';
import { decide, loadConfig } from './guard.mjs';

const lim = limitsOf({});
const fresh = () => ({ story: 0, storyExtra: 0, failures: {} });
const fail = (state, cmd = 'npm run test', out = 'Error: boom') => recordFailure(state, cmd, out);

test('same error three times asks the user', () => {
  const s = fresh();
  fail(s); fail(s);
  assert.equal(evaluate(s, lim).permission, 'allow');
  fail(s);
  const d = evaluate(s, lim);
  assert.equal(d.permission, 'ask');
  assert.match(d.reason, /npm run test/);
});

test('numbers in the error do not create a new failure', () => {
  assert.equal(firstErrorLine('Error: 12 tests failed in 3.4s'), firstErrorLine('Error: 7 tests failed in 9.1s'));
  const s = fresh();
  fail(s, 'npm run test', 'Error: line 10'); fail(s, 'npm run test', 'Error: line 22');
  assert.equal(Object.keys(s.failures).length, 1);
});

test('a passing run clears failures for that command but keeps the story total', () => {
  const s = fresh();
  fail(s); fail(s); fail(s);
  recordSuccess(s, 'npm run test');
  assert.equal(evaluate(s, lim).permission, 'allow');
  assert.equal(s.story, 3);
});

test('extension grants 2 more attempts, then denies at the ceiling of 5', () => {
  const s = fresh();
  for (let i = 0; i < 3; i += 1) fail(s);
  extend(s, lim);
  assert.equal(evaluate(s, lim).permission, 'allow');
  fail(s);
  assert.equal(evaluate(s, lim).permission, 'allow');
  fail(s);
  assert.equal(evaluate(s, lim).permission, 'deny');
  extend(s, lim);
  assert.equal(evaluate(s, lim).permission, 'deny');
});

test('story total asks at 8, extends by 4, denies at 12', () => {
  const s = fresh();
  for (let i = 0; i < 8; i += 1) fail(s, `cmd${i}`, `Error: distinct-${'x'.repeat(i)}`);
  assert.equal(evaluate(s, lim).permission, 'ask');
  extend(s, lim, { story: true });
  assert.equal(s.storyExtra, 4);
  assert.equal(evaluate(s, lim).permission, 'allow');
  for (let i = 8; i < 12; i += 1) fail(s, `cmd${i}`, `Error: distinct-${'y'.repeat(i)}`);
  assert.equal(evaluate(s, lim).permission, 'deny');
});

function tempRoot(state) {
  const root = mkdtempSync(join(tmpdir(), 'attempts-'));
  mkdirSync(join(root, '.ai-sdlc/state'), { recursive: true });
  const config = loadConfig();
  if (state) writeState(config, root, state);
  return { root, config };
}
const shell = (command) => ({ toolName: 'bash', toolArgs: JSON.stringify({ command }) });

test('guard allows verification commands with a clean state', () => {
  const { root, config } = tempRoot();
  assert.equal(decide(shell('npm run test -- --run'), { root, config }).permission, 'allow');
  assert.equal(decide(shell('npm run ai:attempts -- run npm run lint'), { root, config }).permission, 'allow');
});

test('guard asks for verification commands once the limit is reached', () => {
  const s = fresh();
  for (let i = 0; i < 3; i += 1) fail(s);
  const { root, config } = tempRoot(s);
  assert.equal(decide(shell('npm run test -- --run'), { root, config }).permission, 'ask');
  assert.equal(decide(shell('npm run check-types'), { root, config }).permission, 'ask');
  assert.equal(readState(config, root).story, 3);
});

test('guard never lets an agent self-approve extend or reset', () => {
  const { root, config } = tempRoot();
  assert.equal(decide(shell('npm run ai:attempts -- extend'), { root, config }).permission, 'ask');
  assert.equal(decide(shell('npm run ai:attempts -- reset'), { root, config }).permission, 'ask');
  assert.equal(decide(shell('npm run ai:attempts -- status'), { root, config }).permission, 'allow');
});
