# Coding Standards & Codebase Structure

Single source of truth for the `explore`, `developer`, `test-writer` and `review` agents. Architecture rules in `AGENTS.md` take precedence; this file adds detail.

## 1. Codebase structure

Single `package.json` TypeScript monorepo (bulletproof-react layout).

```
server.ts                      API entry (thin: config + DB + app)
server/src/
  app/                         express app, error-handler, request-logger, route mounting
  features/<name>/             <name>.routes.ts, .service.ts, .model.ts, .schema.ts (zod)  [items, users, health]
  lib/                         auth, db, http-error, mailer, rate-limit
  config/env.ts                the only place that reads process.env (validated)
  utils/                       pure helpers (dates)
  testing/                     setup.ts, test-db.ts
client/src/
  app/                         app.tsx, layout.tsx, routes/ (compose features here)
  features/<name>/             api.ts (TanStack Query hooks), components/  [auth, dashboard]
  components/                  shared UI (ErrorBoundary, Loading, ...)
  lib/                         api-client.ts, app-context.tsx
  config/env.ts, utils/, testing/ (setup.ts, mocks/handlers.ts, mocks/server.ts)
scripts/                       one-off tooling; never imported by server/client
docs/                          documentation (this file)
```

Dependency direction (enforced in review): `app → features → shared (lib/components/hooks/utils/config)`. Never the reverse; no feature→feature imports; client and server never import each other.

## 2. Naming & files

- Server files: `<feature>.<role>.ts` (`item.service.ts`, `item.routes.ts`, `item.schema.ts`, `item.model.ts`). Shared/lib files: `kebab-case.ts`.
- Client: React components `PascalCase.tsx` (one main component per file); non-component modules `kebab-case.ts`; hooks `useXxx`.
- Types/interfaces `PascalCase`; variables/functions `camelCase`; constants `UPPER_SNAKE_CASE` only for true constants.
- Tests sit next to the code: `*.test.ts(x)` unit, `*.int.test.ts` server integration.

## 3. TypeScript & style

- Prettier: single quotes, `printWidth` 120, trailing commas `all`. ESLint and `tsc` must be clean.
- `@/` alias for imports within `client/src` and `server/src`; no deep relative `../../..` chains.
- No `any`, `@ts-ignore`, `eslint-disable` or non-null `!` without a written reason. Prefer `unknown` + narrowing, and types inferred from zod (`z.infer`).
- Explicit return types on exported functions; infer for local ones.
- Prefer `const`, early returns, small single-purpose functions, named exports. No dead code, no commented-out code, no stray `console.log`.
- Comments only where intent is non-obvious.

## 4. Server standards

- Layering: `routes → service → model`. Routes parse/validate and shape responses; services hold business logic; only services touch Mongoose models.
- Validate body, params and query with zod at the route edge.
- Errors: throw `HttpError` (`lib/http-error.ts`); the central `error-handler.ts` formats responses. Never leak stack traces or raw DB errors.
- Auth: every non-public route is authenticated; user-owned data is always queried with the authenticated user's id.
- Env only through `config/env.ts`; document new variables in `.env.example`. No secrets in source.
- Async handlers must propagate errors to the error handler.

## 5. Client standards

- Server state via TanStack Query and `lib/api-client.ts`; Zustand/context only for client-only state.
- API hooks live in `features/<name>/api.ts`; components in `features/<name>/components/`.
- Components: function components, typed props, Tailwind for styling, handle loading/error/empty states.
- Every new API call has an MSW handler in `client/src/testing/mocks/handlers.ts`.
- No direct `fetch`/axios calls outside `lib/api-client.ts`; no `import.meta.env` outside `config/env.ts`.

## 6. Testing standards

- Runner: Vitest. Client uses Testing Library + MSW; server integration tests use supertest with `server/src/testing/test-db.ts`.
- Test behavior, not implementation: query by role/text, assert on responses and persisted state.
- Arrange-Act-Assert; one behavior per test; descriptive names (`it('rejects an expense without an amount')`).
- Cover happy path, validation failures, auth (401/403), and user data isolation for server features.
- No real network, real DB beyond the test DB helper, sleeps, or order-dependent tests. Never disable or weaken existing tests.

## 7. Review checklist

1. Matches the structure and dependency direction in section 1.
2. Standards in sections 3–5 respected; no unrelated changes.
3. Security: validation at the edge, auth and user scoping, no secrets, no leaked errors.
4. Tests exist for new behavior and meet section 6.
5. `npm run check-types`, `npm run lint`, `npm run test -- --run` pass.

Severity: **critical** (security/data loss), **high** (bug or architecture violation), **medium** (standards/test gap), **low** (style/nit).