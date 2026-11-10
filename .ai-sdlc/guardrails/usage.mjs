#!/usr/bin/env node
// Usage: npm run ai:usage -- <log.jsonl> [--story "ID"]   estimate tokens and cost from an agent log and record it
//        npm run ai:usage -- report                       show recorded stories and totals
// For VS Code Copilot the debug logs live under workspaceStorage/<id>/GitHub.copilot-chat/debug-logs/<session>/main.jsonl.
// Figures are estimates: Copilot bills premium requests, and log formats are not guaranteed to include token counts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadConfig, repoRoot } from '../hooks/guard.mjs';
import { estimateCost, sumUsage } from '../hooks/usage-lib.mjs';

const config = loadConfig();
const file = resolve(repoRoot, config.usageFile ?? '.ai-sdlc/state/usage.json');
const args = process.argv.slice(2);
const read = () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { stories: [] });

if (args[0] === 'report') {
  const { stories } = read();
  for (const s of stories) console.log(`${s.story}: ${s.requests} requests, ${s.input} in / ${s.output} out tokens, ~$${s.costUSD}`);
  console.log(`Total: ~$${stories.reduce((t, s) => t + s.costUSD, 0).toFixed(4)} over ${stories.length} entries`);
} else if (args[0]) {
  const idx = args.indexOf('--story');
  const story = idx >= 0 ? args[idx + 1] : 'unnamed';
  const usage = sumUsage(readFileSync(resolve(args[0]), 'utf8'));
  if (usage.requests === 0) {
    console.error('No token usage fields found in this log, so nothing was recorded. Check the log format or use billing data instead.');
    process.exit(1);
  }
  const costUSD = estimateCost(usage, config.pricing);
  const data = read();
  data.stories.push({ story, ...usage, costUSD, at: new Date().toISOString() });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${story}: ${usage.requests} requests, ${usage.input} in / ${usage.output} out tokens, ~$${costUSD} (placeholder prices)`);
} else {
  console.error('usage: usage <log.jsonl> [--story ID] | report');
  process.exit(64);
}
