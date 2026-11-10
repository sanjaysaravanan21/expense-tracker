---
name: self-healing-test-loop
description: Run tests, lint or type-checks, read the failure output, fix the cause, and retry with a bounded number of attempts. Use whenever a verification command fails during implementation.
---

# Self-healing test loop

1. Run the narrowest failing command first (single test file, then `npm run check-types`, `npm run lint`, then the full `npm run test -- --run`). Always run it through the counter: `npm run ai:attempts -- run <command>`.
2. Read the first error, not the last. Identify root cause from the stack trace and the code it points to.
3. Fix the production or test code with the smallest change. Re-run the same command.
4. Track attempts per distinct failure (same command + same first error line). Limits come from `selfHealing` in `.ai-sdlc/config.json`:
   - Attempts 1–3 (`maxAttempts`): proceed autonomously.
   - Story total: 8 failed attempts across all failures (`maxStoryAttempts`), then ask.
   - Same first error twice in a row: stop early. The hypothesis is wrong; change the approach or ask.
5. When the limit is reached, STOP and ask the user (ask_user) before any further attempt. Report:
   - command and first error line
   - attempts used (n of limit)
   - what was tried, and why each failed
   - best hypothesis and the proposed next approach
   - options: "Approve +2 attempts" (story total: +4) / "Change approach (describe)" / "Stop and hand over"
6. Never exceed `hardCeiling` (5) for one failure or `storyHardCeiling` (12) per story, even if approved. Report `verdict: fail` instead.
7. Never self-approve an extension. Never run `ai:attempts extend` or `reset`; only the user does, after an explicit reply. `npm run ai:attempts -- status` shows the counters.

Never: delete or skip tests, loosen assertions to match a bug, add `@ts-ignore`/`eslint-disable`, or edit config to hide errors. A repeating identical error means the hypothesis is wrong; change the approach instead of retrying.
