import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  budgetOf, budgetStep, estimateKB, evaluateBudget, extendBudget, readBudget, setStage, writeBudget,
} from './budget-lib.mjs';
import { estimateCost, sumUsage } from './usage-lib.mjs';
import { decide, loadConfig } from './guard.mjs';

const b = budgetOf({});
const fresh = () => ({ calls: 0, outputKB: 0, extraCalls: 0, extraKB: 0, stageExtra: 0, stage: null, stageCalls: {} });

test('asks at 150 calls, extends by 50, denies at 300', () => {
  const s = fresh();
  s.calls = 149;
  assert.equal(evaluateBudget(s, b).permission, 'allow');
  s.calls = 150;
  assert.equal(evaluateBudget(s, b).permission, 'ask');
  extendBudget(s, b);
  assert.equal(evaluateBudget(s, b).permission, 'allow');
  s.calls = 300;
  assert.equal(evaluateBudget(s, b).permission, 'deny');
  extendBudget(s, b);
  extendBudget(s, b);
  extendBudget(s, b);
  assert.equal(s.extraCalls, 150);
});

test('output KB asks at 600 and denies at 1200', () => {
  const s = fresh();
  s.outputKB = 600;
  assert.equal(evaluateBudget(s, b).permission, 'ask');
  s.outputKB = 1200;
  assert.equal(evaluateBudget(s, b).permission, 'deny');
});

test('stage budget asks when the stage cap is reached', () => {
  const s = setStage(fresh(), 'pm-analyst');
  s.stageCalls['pm-analyst'] = 29;
  assert.equal(evaluateBudget(s, b).permission, 'allow');
  s.stageCalls['pm-analyst'] = 30;
  assert.equal(evaluateBudget(s, b).permission, 'ask');
  extendBudget(s, b);
  assert.equal(evaluateBudget(s, b).permission, 'allow');
});

function tempRoot(state, files = {}, { story = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(root, '.ai-sdlc/state'), { recursive: true });
  const config = loadConfig();
  if (story) writeFileSync(join(root, config.scopeFile), JSON.stringify({ story: 'T-1', allowed: ['server/'] }));
  if (state) writeBudget(config, root, state);
  for (const [name, size] of Object.entries(files)) writeFileSync(join(root, name), 'x'.repeat(size));
  return { root, config };
}
const shellN = (command) => ({ kind: 'shell', command, input: { command }, cwd: '.' });

test('budgetStep counts calls and stages', () => {
  const { root, config } = tempRoot(setStage(fresh(), 'developer'));
  budgetStep(shellN('npm run lint'), config, root);
  budgetStep(shellN('npm run lint'), config, root);
  const s = readBudget(config, root);
  assert.equal(s.calls, 2);
  assert.equal(s.stageCalls.developer, 2);
});

test('ad-hoc work outside a story is not counted or limited', () => {
  const s = fresh();
  s.calls = 500;
  const { root, config } = tempRoot(s, {}, { story: false });
  assert.equal(budgetStep(shellN('npm run lint'), config, root).permission, 'allow');
  assert.equal(readBudget(config, root).calls, 500);
});

test('setting a stage activates the budget without a scope file', () => {
  const { root, config } = tempRoot(setStage(fresh(), 'pm-analyst'), {}, { story: false });
  budgetStep(shellN('git status'), config, root);
  assert.equal(readBudget(config, root).stageCalls['pm-analyst'], 1);
});

test('large full-file reads ask; ranged reads and small files are allowed', () => {
  const { root, config } = tempRoot(null, { 'big.txt': 100 * 1024, 'small.txt': 1024 });
  const read = (input) => ({ kind: 'read', input, cwd: root });
  assert.equal(budgetStep(read({ path: join(root, 'big.txt') }), config, root).permission, 'ask');
  assert.equal(budgetStep(read({ path: join(root, 'big.txt'), view_range: [1, 50] }), config, root).permission, 'allow');
  assert.equal(budgetStep(read({ path: join(root, 'small.txt') }), config, root).permission, 'allow');
  assert.equal(estimateKB({ path: join(root, 'small.txt') }, 'read', b, root, root), 1);
});

test('at the limit the agent is blocked but can still read budget status', () => {
  const s = fresh();
  s.calls = 150;
  const { root, config } = tempRoot(s);
  assert.equal(budgetStep(shellN('npm run lint'), config, root).permission, 'ask');
  assert.equal(budgetStep(shellN('npm run ai:budget -- status'), config, root).permission, 'allow');
});

test('guard never lets an agent self-approve budget extend or reset', () => {
  const { root, config } = tempRoot();
  const call = (command) => decide({ toolName: 'bash', toolArgs: JSON.stringify({ command }) }, { root, config }).permission;
  assert.equal(call('npm run ai:budget -- extend'), 'ask');
  assert.equal(call('npm run ai:budget -- reset'), 'ask');
  assert.equal(call('npm run ai:budget -- status'), 'allow');
  assert.equal(call('npm run ai:budget -- stage developer'), 'allow');
});

test('usage parser sums token fields across formats and ignores bad lines', () => {
  const log = [
    JSON.stringify({ type: 'llm', usage: { input_tokens: 1000, output_tokens: 200 } }),
    JSON.stringify({ attrs: { prompt_tokens: 3000, completion_tokens: 800 } }),
    'not json',
    JSON.stringify({ type: 'tool_call', name: 'read' }),
  ].join('\n');
  const u = sumUsage(log);
  assert.deepEqual(u, { input: 4000, output: 1000, requests: 2, skipped: 1 });
  assert.equal(estimateCost(u, { default: { inputPerMTok: 3, outputPerMTok: 15 } }), 0.027);
});
