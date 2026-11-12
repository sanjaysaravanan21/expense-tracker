# AGENTS.md

Expense Tracker: a TypeScript monorepo with a single `package.json`. `server.ts` (repo root) starts the Express + Mongoose API whose code lives in `server/`; the React + Vite + Tailwind UI lives in `client/`. Structure follows the bulletproof-react conventions.

## Layout

- `server.ts`: API entry; wires config, DB and the app from `server/`. Keep it thin.
- `server/src/app/`: Express app, middleware, route mounting, error handler.
- `server/src/features/<name>/`: `routes`, `service`, `model`, `schema` (zod), tests for one domain (`items`, `users`, `health`).
- `server/src/{lib,config,utils,testing}/`: shared infrastructure (auth, mail, db), validated env, helpers, test setup.
- `client/src/app/`: shell, providers, routing. `client/src/features/<name>/`: API hooks and components per domain.
- `client/src/{lib,components,hooks,utils,config,testing}/`: shared client code; `testing` holds MSW handlers and data generators.
- `scripts/`: one-off tooling (data generators, etc.). Never imported by `server/` or `client/`.
- `.ai-sdlc/`: Story-to-Code pipeline (prompts, guardrails, hooks). `.github/`, `.claude/`, `.cursor/`: tool configs that point at it.

## Architectural rules

- A feature must not import from another feature; compose features in `client/src/app/routes` (client) or `server/src/app` (server).
- Shared code (`lib`, `components`, `hooks`, `utils`, `config`) must not import from `features` or `app`; features must not import from `app`.
- `client` and `server` never import each other. Types needed by both go in a dedicated `shared/` folder once that need exists (not before).
- Server: routes call services; only services touch models. Validate every request body, params and query with zod at the route edge. Read env only through `server/src/config/env.ts`.
- Server: errors flow through the central error handler; never leak stack traces or raw DB errors to clients.
- Server: every non-public route requires auth; user-scoped data is always filtered by the authenticated user.
- Client: server state goes through TanStack Query and `lib/api-client.ts`; Zustand only for client-only state.
- Client: every new API call has an MSW handler under `client/src/testing/mocks`.
- Secrets never live in source. Document variables in `.env.example`; never read or write real `.env*` files.

## Conventions

- TypeScript everywhere, explicit types where they add clarity. `@/` alias for imports inside `client/src` and `server/src`.
- Feature-first organization; keep business logic in the feature that owns it.
- Reuse existing primitives before adding abstractions or dependencies.
- Keep changes small and targeted; do not refactor unrelated code or fix unrelated issues.
- Tests assert real behavior, sit next to the code, and use the helpers in `testing/`.

## Validation

```bash
npm run check-types
npm run lint
npm run test -- --run
npm run test:ai        # guardrail/hook unit tests (node:test)
```

## Agentic workflow

Work from a story or ticket uses the `story-to-code` pipeline (`.ai-sdlc/pipeline.md`): sanitize → PM/Analyst → approval → scope lock → Developer → Reviewer → validate → PR.
For ad-hoc requests: read the narrowest files first, make the minimal change that matches existing patterns, verify, then summarize what changed and which checks ran. If the request is ambiguous, clarify behavior, affected area and acceptance criteria before changing code.

Guardrail and agent config (`.ai-sdlc/`, `.github/`, `.claude/`, `.cursor/`, `.husky/`, this file) is edited by humans. Hooks deny agent writes there, deny `.env*`/key reads, and lock writes to the story scope when `.ai-sdlc/state/scope.json` exists.

Ask for explicit user permission before accessing Copilot session logs. If a hook denies access, report the denial; do not work around it.

## Commands

```bash
npm install
npm run ai:scope -- --story "ID" server/src/features/items/   # set story scope
npm run ai:scope -- --clear
npm run ai:sanitize -- ticket.txt                              # strip PII before prompting
npm run ai:validate                                            # staged-change secret/scope check
npm run ai:attempts -- run <command>                           # run a check and count failures (3 per failure, 8 per story)
npm run ai:attempts -- status                                  # attempt counters; `extend`/`reset` are user-only
npm run ai:budget -- status                                    # story tool-call/KB budget (150 calls, ~600 KB); `stage <name>`, `extend`/`reset` (user-only)
npm run ai:usage -- <agent-log.jsonl> --story "ID"             # estimate tokens/cost from an agent log; `report` totals
```
