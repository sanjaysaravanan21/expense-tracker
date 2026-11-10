@AGENTS.md
@.github/copilot-instructions.md

## Claude Code notes

- Subagents: `.claude/agents/`. Skills: `.claude/skills/` (symlink to `.github/skills/`; Cursor reads it too).
- For a Jira story run the `story-to-code` skill. Subagents cannot spawn subagents, so the main session orchestrates per `.ai-sdlc/pipeline.md`.
- Hooks are in `.claude/settings.json` and call `.ai-sdlc/hooks/guard.mjs`.