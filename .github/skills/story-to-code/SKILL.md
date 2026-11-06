---
name: story-to-code
description: Run a user story or ticket through the guarded PM/Analyst, Developer and Reviewer pipeline and end with a ready-to-open PR. Use for any Jira or GitHub story.
---

Follow `.ai-sdlc/pipeline.md`. Delegate stages to the `pm-analyst`, `developer` and `reviewer` agents (their instructions are in `.ai-sdlc/prompts/`). In tools where subagents cannot spawn subagents (Claude Code), the main session runs this skill and invokes each stage itself.
