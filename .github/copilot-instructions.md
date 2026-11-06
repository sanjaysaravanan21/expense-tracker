# GitHub Copilot instructions for expense-tracker

Follow `AGENTS.md` for architecture, conventions and validation; it is the single source of truth.

## Essentials

- `server.ts` + `server/` is the Express/Mongoose API; `client/` is the React/Vite UI. They never import each other.
- Feature-first folders, `@/` imports, zod validation at the server edge, TanStack Query on the client.
- Run `npm run check-types`, `npm run lint`, `npm run test -- --run` before finishing.
- Never read or write `.env*` or key files; use `.env.example` for documented variables.

## Story-driven delivery

For work from a Jira or GitHub story, use the `story-to-code` agent (`.github/agents/story-to-code.agent.md`). It runs `.ai-sdlc/pipeline.md` with the `pm-analyst`, `developer` and `reviewer` agents. Do not claim a ticket was read, a PR was opened, or checks passed unless an integration or command output confirms it.

Hooks (`.github/hooks/guard.json`) enforce the guardrails; if an operation is denied, report it instead of working around it.
