---
name: self-healing-test-loop
description: Run tests, lint or type-checks, read the failure output, fix the cause, and retry with a bounded number of attempts. Use whenever a verification command fails during implementation.
---

# Self-healing test loop

1. Run the narrowest failing command first (single test file, then `npm run check-types`, `npm run lint`, then the full `npm run test -- --run`).
2. Read the first error, not the last. Identify root cause from the stack trace and the code it points to.
3. Fix the production or test code with the smallest change. Re-run the same command.
4. Count attempts per distinct failure. Limit: `selfHealing.maxAttempts` in `.ai-sdlc/config.json` (3).
5. Stop and report `verdict: fail` with the command, the error, what you tried, and your best hypothesis when the limit is reached or the fix needs files outside the scope.

Never: delete or skip tests, loosen assertions to match a bug, add `@ts-ignore`/`eslint-disable`, or edit config to hide errors. A repeating identical error means the hypothesis is wrong; change the approach instead of retrying.
