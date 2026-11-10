# Coding Standards & Codebase Structure

Single source of truth for the `explore`, `developer`, `test-writer` and `review` agents. Architecture rules in `AGENTS.md` take precedence; this file adds detail.

## 1. Codebase structure

Single `package.json` TypeScript monorepo (bulletproof-react layout).

```text
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

- Branch names: use `issue-<ticket-or-number>-<short-kebab-case-title>` when a ticket is available. For Jira story `EXP-123`, use its lowercase key, for example `issue-exp-123-add-monthly-summary`. For issue number `42`, use `issue-42-add-monthly-summary`. If there is no ticket number, use `issue-<short-kebab-case-title>`, for example `issue-improve-monthly-summary`. Keep names lowercase and concise; use only letters, numbers, and hyphens.
- Use the actual uppercase Jira key, for example `EXP-123`, when referencing the story in commits and pull requests.
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
- For monetary changes, test precision, validation bounds, aggregation, and formatting for each supported currency; never use approximate floating-point equality for exact monetary expectations.
- For date/time changes, test calendar boundaries and the specified timezone semantics; include daylight-saving transitions when local times or instants are involved.
- For UI changes, test accessible names, roles, and keyboard-relevant behavior with Testing Library; use a manual keyboard and assistive-technology check for significant journeys or custom controls.
- For security-sensitive behavior, test unauthenticated and cross-user access, invalid input, and that logs and error responses do not disclose secrets or personal/financial data.
- No real network, real DB beyond the test DB helper, sleeps, or order-dependent tests. Never disable or weaken existing tests.
- Every behavior change and bug fix adds or updates regression tests. Use unit tests for isolated logic and integration tests when API, persistence, authentication, or component boundaries are involved; include both when they cover distinct risks.
- Use Playwright for meaningful end-to-end browser journeys; don’t duplicate lower-level assertions without added value.
- If a relevant test layer is not added, explain why and identify what evidence covers the behavior.

## 7. Security, privacy, and data integrity

Use the [OWASP Application Security Verification Standard (ASVS) 5.0.0](https://owasp.org/www-project-application-security-verification-standard/) as the application-security review baseline and the [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) for logging decisions. These are engineering references, not a claim of certification or legal compliance.

### P0 — Protect accounts and user data

- Treat expense, income, account, and contact data as sensitive. Collect and return only fields needed for the feature; never trust a client-supplied owner identifier when the authenticated identity is available.
- Keep every non-public route authenticated and every user-owned read, update, and delete scoped to the authenticated user. Add negative authorization and cross-user isolation tests for affected routes.
- Validate all request inputs at the route edge with zod, including bounds and allowed values. Return safe, expected errors through the central handler; never expose stack traces, raw database errors, credentials, or tokens.
- Keep secrets in validated environment configuration. Do not log request bodies, query strings, authorization headers, passwords, one-time codes, or expense/account/contact details. Security logs should record only the minimum context needed to investigate an event and must have controlled access.

### P1 — Preserve financial and calendar meaning

- Before adding or changing monetary storage, document the supported currencies and the storage/rounding invariant. A numeric amount without a currency is not sufficient for multi-currency data. Do not silently convert currencies or combine unlike currencies in a total.
- Represent persisted and aggregated money exactly: prefer integer minor units when the currency and range permit, otherwise use an explicit decimal representation. Do not use binary floating-point arithmetic for monetary calculations. Format at the UI boundary with the amount's currency code and an explicit locale; do not infer currency from a symbol.
- For existing data, preserve its established meaning. The current item model stores `amount` as a number and the UI displays rupees without a per-item currency field; treat this as existing single-currency behavior, not a pattern for new multi-currency work. Changing it requires an explicit migration and regression coverage.
- Treat expense dates as calendar dates (`YYYY-MM-DD`) and do not shift them through local-time conversions. Treat instants as ISO 8601 UTC timestamps. If a feature stores a local time or groups data by a user's day, define and persist the relevant IANA timezone; do not assume the server timezone or the user's location.
- Keep financial record changes attributable when the product requires an audit trail. Before adding one, define its purpose, recorded events, actor attribution, integrity/access controls, retention, and relationship to user deletion. Keep audit trails distinct from operational/security logs, and never copy full expense payloads into logs by default.

### P1 — Make essential flows accessible

- Use [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/) as the target for new or materially changed UI; this target does not by itself establish conformance.
- Provide programmatic names and instructions for controls, semantic structure, keyboard operation and visible focus. Associate validation errors with their fields and announce important status changes. Do not communicate category, chart, or validation meaning by color alone; provide text or a data alternative for charts.
- Verify significant user journeys with keyboard navigation and a representative assistive-technology check in addition to automated/component tests. Record known exceptions and follow-up work in the change evidence.

### P2 — Set privacy, retention, and jurisdiction policy deliberately

- Before collecting a new category of personal or financial data, document its purpose, necessity, access, sharing, and deletion behavior. Do not invent a retention period: define one from the product purpose and confirmed jurisdictional requirements, and account for backups and derived data.
- Before making legal or regulatory claims or setting jurisdiction-specific retention, export, or deletion rules, the product owner must identify target users and jurisdictions and obtain appropriate legal review. This standard is not legal advice and does not presume a particular jurisdiction.

## 8. Enforcement and review

- Apply the relevant P0/P1/P2 rules to each change and record test or review evidence in the repository's pull request template. If a rule does not apply or a test layer is omitted, state why and what evidence covers the risk.
- Review security and privacy-sensitive changes against ASVS; review changed UI against WCAG 2.2 AA. Use the existing type, lint, unit/integration, and E2E checks as applicable; do not treat passing automated checks as proof of accessibility or security compliance.
- No custom MCP is warranted for enforcing the current standards: they are stable, version-controlled project guidance that can be reviewed with code and tests. Reconsider one only if a concrete need arises for dynamic policy retrieval or structured, automated validation that cannot be met by these documents and existing checks.
- Atlassian MCP serves a different purpose: accessing Jira stories and, with approval, posting updates as described in `.ai-sdlc/pipeline.md`. It does not replace these standards or the repository's validation checks.

## 9. Review checklist

1. Matches the structure and dependency direction in section 1.
2. Standards in sections 3–5 respected; no unrelated changes.
3. Apply relevant security, privacy, financial-data, date/time, and accessibility rules in section 7; record evidence in the pull request template.
4. Tests exist for new behavior and meet section 6.
5. `npm run check-types`, `npm run lint`, `npm run test -- --run` pass.

Severity: **critical** (security/data loss), **high** (bug or architecture violation), **medium** (standards/test gap), **low** (style/nit).