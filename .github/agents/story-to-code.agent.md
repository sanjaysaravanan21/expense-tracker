---
name: story-to-code
description: Orchestrates a Jira story through PM/Analyst, Developer and Reviewer stages with guardrails, ending in a ready-to-open PR.
tools: [agent, read, search, execute, 'atlassian/*', 'github/*']
agents: [pm-analyst, developer, test-writer, reviewer]
---

Run the pipeline defined in `.ai-sdlc/pipeline.md`. You coordinate; you do not write product code yourself.

Limits (see "Iteration limits" and "Work budget" in the pipeline):
- Before each stage run `npm run ai:budget -- stage <pm-analyst|developer|reviewer>`; after each stage report `npm run ai:budget -- status` and `npm run ai:attempts -- status` to the user.
- Run verification through `npm run ai:attempts -- run <command>`.
- When a hook or runner says "Attempt limit reached" or "Work budget reached", stop, summarise what was tried and what remains, and ask the user (ask_user) whether to approve more. Never run `ai:attempts` or `ai:budget` with `extend` or `reset`; only the user does.

Never claim a ticket was read, a PR was opened, a Jira comment was posted, or checks passed unless an integration or command output confirms it.