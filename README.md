# Expense Tracker

Express + Mongoose API (`server.ts`, `server/`) and React + Vite UI (`client/`) in one repo with one `package.json`.

## Layout

| Path | Purpose |
|------|---------|
| `server.ts` | API entry (repo root); loads env, connects the DB, starts the app |
| `server/src/app/` | Express app, middleware, error handler |
| `server/src/features/{items,users,health}/` | Routes, services, models and zod schemas per domain |
| `server/src/{lib,config,utils}/` | Auth, mail, DB, rate limiting, validated env, date helpers |
| `client/src/app/` | App shell, layout, routes |
| `client/src/features/{auth,dashboard}/` | UI and API calls per domain |
| `client/src/{lib,components,utils,config,testing}/` | Shared client code, API client, MSW mocks |
| `scripts/` | One-off tooling (sample data generator) |
| `.ai-sdlc/` | Story-to-Code pipeline: prompts, guardrails, hooks, `config.json` |
| `.github/`, `.claude/`, `.cursor/` | Copilot (primary), Claude Code and Cursor configs pointing at `.ai-sdlc/` |

See [AGENTS.md](./AGENTS.md) for architecture rules and [.ai-sdlc/pipeline.md](./.ai-sdlc/pipeline.md) for the story workflow.

## Setup

```bash
cp .env.example .env   # fill in real values locally; never commit .env
npm install
```

Needs Node 20+ and a MongoDB instance (`DB_URL`). Variables are documented in `.env.example`:

| Variable | Notes |
|----------|-------|
| `DB_URL`, `JWT_SECRET` | Required. `JWT_SECRET` must be at least 16 characters |
| `PORT` | Default `4500` |
| `JWT_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGIN` | Comma-separated allowlist. `*` is rejected when `NODE_ENV=production` |
| `TRUST_PROXY` | Number of reverse proxies in front of the API (usually `1` on a host), so rate limits see real client IPs |
| `MAIL_USER`, `MAIL_KEY` | Needed for OTP email; without them `POST /users/sign-in` returns 503 |
| `VITE_API_URL` | Client: API base URL, default `http://localhost:4500` |

## Run

```bash
npx tsx watch --tsconfig server/tsconfig.json server.ts      # API with reload
npx vite --config client/vite.config.ts --host                # UI dev server
```

Production build:

```bash
npx esbuild server.ts --bundle --platform=node --format=esm --packages=external \
  --tsconfig=server/tsconfig.json --outfile=dist/server.js    # then: node dist/server.js
npx vite build --config client/vite.config.ts                 # static UI in dist/client
```

## Verify

```bash
npx tsc -p server/tsconfig.json && npx tsc -p client/tsconfig.json
npx eslint . --max-warnings=0 && npx eslint client --max-warnings=0
TEST_DB_URL=mongodb://127.0.0.1:27017 npx vitest run          # server; DB tests skip without TEST_DB_URL
npx vitest run --config client/vite.config.ts                 # client
npm run test:ai                                               # guardrail and hook tests
```

### End-to-end tests (Playwright)

Browser tests in `client/e2e/` drive the real UI against the real API and a dedicated MongoDB database; nothing is stubbed except email delivery.

- **Isolation:** the API starts on port 4501 with `NODE_ENV=test` and `DB_URL=$E2E_DB_URL` (default `mongodb://127.0.0.1:27017/expense-tracker-e2e`). The database name must end in `-e2e`, otherwise the run refuses to start. Global setup and teardown drop it, so no data is left behind. Each test creates its own uniquely named user.
- **OTP:** the API runs with `MAIL_TRANSPORT=disabled`, which skips sending email. The env schema only accepts that value when `NODE_ENV=test`, so production (and development) always send real OTPs. Tests read the generated OTP from the E2E database.
- **Scenarios:** registration and login (incl. wrong OTP, duplicate and unknown users), adding and viewing an expense, validation errors, and per-user data isolation.
- **Diagnostics:** traces, screenshots and video are kept for failures, plus an HTML report and API/Vite logs in the console.

```bash
npx playwright install chromium     # once
mongod --dbpath <dir>               # or any MongoDB reachable at E2E_DB_URL
npm run test:e2e
npx playwright show-report node_modules/.cache/playwright/report
npx playwright show-trace <path to trace.zip>
```

CI (GitHub Actions): use a job with a `mongo:7` service, `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e` with `CI=true`, and upload `node_modules/.cache/playwright/` as an artifact on failure. Agent config under `.github/` is human-edited, so the workflow file is not added automatically.

A Playwright MCP server is not configured: it is useful for ad-hoc, agent-driven browser exploration but is not repeatable and cannot replace these tests.

## API

`/items` routes require an `Authorization` header with the JWT (raw token or `Bearer <token>`) and only touch the caller's data.

| Route | Purpose |
|-------|---------|
| `GET /server/health` | Health check |
| `POST /users`, `/users/sign-in`, `/users/verify-otp` | Register, request an OTP by email, exchange the OTP for a token (rate limited) |
| `PUT`, `DELETE /users/:id` | Update or delete your own account |
| `GET /items/day/:date`, `/items/week/:startDate`, `/items/month/:startDate` | Expense views |
| `POST /items`, `PUT`, `DELETE /items/:id` | Manage expenses |
