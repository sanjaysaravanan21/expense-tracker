---
name: story-to-code
description: Run a Jira story through the guarded PM/Analyst, Developer and Reviewer pipeline and end with a ready-to-open PR.
---

Follow `.ai-sdlc/pipeline.md`. Delegate stages to the `pm-analyst`, `developer` and `reviewer` agents (their instructions are in `.ai-sdlc/prompts/`). In tools where subagents cannot spawn subagents (Claude Code), the main session runs this skill and invokes each stage itself.

Set the stage before each one (`npm run ai:budget -- stage <name>`), run checks through `npm run ai:attempts -- run <command>`, and report both `status` commands after each stage. On "Attempt limit reached" or "Work budget reached", stop and ask the user; never run `extend` or `reset` yourself.