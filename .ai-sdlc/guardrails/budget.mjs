#!/usr/bin/env node
// Usage: npm run ai:budget -- status            show work budget (tool calls, KB read, stage)
//        npm run ai:budget -- stage <name>      orchestrator: set the current stage (pm-analyst|developer|reviewer)
//        npm run ai:budget -- extend            HUMAN approval: grant more budget (agents must never run this)
//        npm run ai:budget -- reset             clear the budget
import { loadConfig, repoRoot } from '../hooks/guard.mjs';
import {
  allowedCalls, allowedKB, budgetOf, extendBudget, readBudget, resetBudget, setStage, stageAllowed, writeBudget,
} from '../hooks/budget-lib.mjs';

const config = loadConfig();
const b = budgetOf(config);
const [cmd, arg] = process.argv.slice(2);

function status() {
  const s = readBudget(config, repoRoot);
  console.log(`Tool calls: ${s.calls}/${allowedCalls(s, b)} (ceiling ${b.toolCallCeiling})`);
  console.log(`Read into context: ~${s.outputKB}/${allowedKB(s, b)} KB (ceiling ${b.outputCeilingKB})`);
  const cap = stageAllowed(s, b);
  if (s.stage) console.log(`Stage ${s.stage}: ${s.stageCalls[s.stage] ?? 0}${cap != null ? `/${cap}` : ''} calls`);
}

if (cmd === 'status') status();
else if (cmd === 'stage') {
  writeBudget(config, repoRoot, setStage(readBudget(config, repoRoot), arg));
  status();
} else if (cmd === 'extend') {
  writeBudget(config, repoRoot, extendBudget(readBudget(config, repoRoot), b));
  status();
} else if (cmd === 'reset') {
  resetBudget(config, repoRoot);
  console.log('Work budget cleared.');
} else {
  console.error('usage: budget <status|stage <name>|extend|reset>');
  process.exit(64);
}
