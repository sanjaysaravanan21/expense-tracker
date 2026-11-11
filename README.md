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

Needs Node 20+. MongoDB is required for persistent data, but optional for
non-production UI development with in-memory mock data. See
[Database and mock modes](#database-and-mock-modes) before starting the API.
Variables in `.env.example` are:

| Variable | Notes |
|----------|-------|
| `DB_URL` | MongoDB connection URL; required in production. Omit it outside production to use mock mode with `MOCK_DATA=auto` or `always` |
| `JWT_SECRET` | Signing secret of at least 16 characters; required whenever `DB_URL` is set, even with `MOCK_DATA=always`. When both are omitted, a fixed development secret is used for mock mode |
| `MOCK_DATA` | `auto` (default) tries MongoDB and falls back to mock data if missing or unreachable; `always` skips MongoDB; `never` requires a connection. Production always uses `never` |
| `PORT` | Default `4500` |
| `JWT_EXPIRES_IN` | Default `7d` |
| `CORS_ORIGIN` | Comma-separated allowlist. `*` is rejected when `NODE_ENV=production` |
| `TRUST_PROXY` | Number of reverse proxies in front of the API (usually `1` on a host), so rate limits see real client IPs |
| `MAIL_USER`, `MAIL_KEY` | Needed for OTP email; without them `POST /users/sign-in` returns 503 |
| `MAIL_TRANSPORT` | `gmail` (default) sends OTP email; `disabled` skips delivery and is allowed only with `NODE_ENV=test` |
| `VITE_API_URL` | Client: API base URL, default `http://localhost:4500` |

## AI-SDLC onboarding

The [Story-to-Code pipeline](./.ai-sdlc/pipeline.md) uses Jira Cloud for stories,
GitHub for code, pull requests and CI, and Playwright MCP for optional browser
exploration. Jira and GitHub MCP authentication uses environment variables
separate from the application's `.env` setup. No Jira site URL or GitHub
repository URL environment variable is required.

### Agents and when to use them

Agent definitions live in [`.github/agents/`](./.github/agents/) for GitHub
Copilot and [`.claude/agents/`](./.claude/agents/) for Claude Code. Both use the
shared prompts and guardrails in `.ai-sdlc/`. For Jira work, use the
orchestrator rather than running the stages independently.

| Agent | Use it when… | Responsibility and boundaries |
|-------|--------------|-------------------------------|
| `story-to-code` | Implementing a Jira story end to end | Orchestrates analysis, approval, scoped implementation, review and delivery through [the pipeline](./.ai-sdlc/pipeline.md). Available as a GitHub Copilot agent; Claude Code uses the shared `story-to-code` skill. |
| `pm-analyst` | A story needs to be clarified and scoped | Read-only: produces acceptance criteria, risk tier, impacted paths, tests and a proposed scope. |
| `developer` | The approved spec and scope are ready | Implements the change test-first within scope. Does not approve its own attempt or budget extensions. |
| `test-writer` | The spec calls for focused or broader test coverage | Adds and updates tests only; hands production-code changes to `developer`. |
| `reviewer` | Implementation is ready for independent verification | Checks the diff against the spec, tests and acceptance criteria; reports findings without fixing code. |
| `explore` | You have a codebase question or need to find where a change belongs | Read-only: traces structure and behavior, then suggests relevant files; does not implement changes. |

For one-off questions, use `explore`. For ticketed work, start with
`story-to-code`; it runs the other stages in order and pauses for required user
approvals.

### 1. Prepare credentials

- **GitHub (`GITHUB_MCP_TOKEN`):** In [fine-grained token settings](https://github.com/settings/personal-access-tokens), select **Generate new token**, name it, choose an expiration and resource owner, and restrict it to this repository. Grant Contents and Actions read-only and, if creating PRs, Pull requests read and write; Metadata read-only is normally selected automatically. Generate and copy the token. Git operations such as `git push` may require separate Git credentials.
- **Atlassian (`ATLASSIAN_MCP_BASIC`):** Create a standard API token **without scopes** at [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens) for an account that can access the Jira site. This token is not restricted by token scopes; account permissions and organization policies still apply. Copy the token and note its owner's account email. The next step combines them into `ATLASSIAN_MCP_BASIC`. Your organization must allow API-token authentication for MCP; posting comments requires appropriate write access.
- Use short-lived, least-privilege credentials. Never commit tokens, put them in MCP configuration files, paste them into chat, or show them in screenshots, logs or demos.

### 2. Supply environment variables

| Variable | Value expected by the MCP configuration |
|----------|-----------------------------------------|
| `GITHUB_MCP_TOKEN` | GitHub PAT without the `Bearer ` prefix |
| `ATLASSIAN_MCP_BASIC` | Base64-encoded `email:api_token`, without the `Basic ` prefix |

Base64 is encoding, not encryption: `ATLASSIAN_MCP_BASIC` is a secret just like
the original token. Supply both variables via a secret manager or your host
environment. They must be present in the process environment of the MCP client;
the application `.env` file is not automatically loaded by portable MCP
configuration.

For a temporary local session, this Bash example prompts without echoing the
tokens or putting their values in command history. Do not use shell tracing
(`set -x`), record the terminal, or run this in an untrusted environment:

```bash
read -r -s -p "GitHub MCP token: " GITHUB_MCP_TOKEN
printf '\n'
read -r -p "Atlassian account email: " ATLASSIAN_EMAIL
read -r -s -p "Atlassian API token: " ATLASSIAN_API_TOKEN
printf '\n'
ATLASSIAN_MCP_BASIC=$(printf '%s:%s' "$ATLASSIAN_EMAIL" "$ATLASSIAN_API_TOKEN" | base64 | tr -d '\n')
export GITHUB_MCP_TOKEN ATLASSIAN_MCP_BASIC
unset ATLASSIAN_EMAIL ATLASSIAN_API_TOKEN
```

Launch the MCP client from an environment that inherits these variables. An
already-running editor may not inherit variables set later in a terminal:
fully restart it from the prepared environment, then restart its MCP servers.
For remote workspaces or containers, provide the variables to the environment
where the client connection runs. When finished, close the client and run
`unset GITHUB_MCP_TOKEN ATLASSIAN_MCP_BASIC` in the shell.

### 3. Start and verify the MCP servers

The repository includes client-specific configurations:

| Client | Configuration | Environment reference syntax |
|--------|---------------|------------------------------|
| VS Code Local | [`.vscode/mcp.json`](./.vscode/mcp.json) | `${env:NAME}` |
| Copilot portable / Claude Code | [`.mcp.json`](./.mcp.json) | `${NAME}` |
| Cursor | [`.cursor/.mcp.json`](./.cursor/.mcp.json) | `${env:NAME}` |

Select the configuration supported by your client and session target; avoid
loading duplicate server definitions. VS Code Copilot and Local sessions can
use different configurations. See the [VS Code MCP configuration reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)
and your client's documentation. MCP configuration is human-edited only.

1. Start the `atlassian` and `github` servers in the client and confirm their
   tools are available. Confirm that the story orchestrator can access both
   namespaces and the operations needed for the workflow.
2. Ask the orchestrator to read a synthetic Jira story such as `EXP-123`. The
   Atlassian MCP server can list sites accessible to the authenticated account
   and provide the cloud ID needed to fetch the issue. If there are multiple
   sites or the target is unclear, specify the site; don't assume the ticket
   key uniquely identifies it.
3. Check GitHub access to this repository with a read-only request. The
   workspace supplies repository context; a PR number alone is ambiguous across
   repositories. Specify `owner/repo#number` when the repository is unclear.
4. For an end-to-end demo, approve the spec and scope, then verify the actual
   test results and PR. Approve a Jira comment separately and confirm it appears
   on the intended issue. Never claim an operation succeeded without evidence.

If authentication fails, check variable availability in the client process,
token expiry, scopes, site/repository permissions and organization policies;
do not print the variables while troubleshooting. If Jira is unavailable, paste
the story for the pipeline and post any requested update manually. If GitHub
integration is unavailable, use the pipeline's PR text handoff.

### 4. Verify the AI-SDLC setup

Before starting a Jira story or bug fix, confirm the local setup is ready:

- [ ] Confirm `npm run test:ai` passes.
- [ ] Confirm the commands are available: `npm run ai:attempts -- status` and
  `npm run ai:budget -- status`.
- [ ] If using Jira/GitHub MCP, run a read-only smoke test: ask the agent to
  list Jira sites and confirm it can read a known, non-sensitive issue; then
  ask it to read this repository's metadata through GitHub MCP. Verify the
  returned site, issue key/title, and repository name match what you expect.
  Do not test by creating a Jira comment, branch, or PR.
- [ ] For a Jira story, use `story-to-code`. Approve the sanitized spec and
  scope before implementation; check the budget and attempt status after each
  stage. Run verification through `npm run ai:attempts -- run <command>`.
- [ ] For an ad-hoc bug fix, reproduce the bug, add or identify a regression
  test, review the diff, and confirm the relevant checks pass. Set a budget
  stage if you want the story activity budget to apply.
- [ ] Treat budget counters as activity proxies, not token or cost tracking.
  `ai:usage` could not read token usage from the VS Code Copilot logs checked;
  use GitHub/Copilot billing for actual spend.

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

### Database and mock modes

Mock mode is intended for UI development without MongoDB and as a fallback
when the database is unavailable. It uses a separate in-memory store: changes
are **not saved to MongoDB**, are lost when the server restarts, and are not
synced to MongoDB if it becomes available later.

| `MOCK_DATA` | Non-production behavior |
|-------------|-------------------------|
| `auto` (default) | Connect to MongoDB when available; otherwise warn and use mock data. Check the startup logs so an outage is not mistaken for persistent storage. |
| `always` | Skip the database connection and use mock data, even if `DB_URL` is set. Useful for database-free UI development. |
| `never` | Require MongoDB; fail startup instead of falling back. Use this when persistence is required. |

For database-free development, set `MOCK_DATA=always` in your local `.env` and
remove or comment out `DB_URL` if you don't need it. The example file sets
`DB_URL` and a placeholder `JWT_SECRET`; if `DB_URL` remains set, validation
still requires replacing the placeholder with a secret of at least 16
characters, even in forced mock mode. Never commit real secrets.

For persistent development data, configure a reachable `DB_URL` and a valid
`JWT_SECRET`, and set `MOCK_DATA=never`. Production always behaves as `never`,
regardless of the configured `MOCK_DATA` value.

At startup, look for **“Connected to MongoDB”** or **“Running with mock data”**
in the server output to confirm which store is active. In mock mode, log in as
`9999999999` with OTP `123456` to see seeded items; other registered users
start empty.

### End-to-end tests (Playwright)

Browser tests in `client/e2e/` drive the real UI against the real API running in mock-data mode (`MOCK_DATA=always`), so no database is needed.

- **Isolation:** the API starts on port 4501 with `NODE_ENV=test` and in-memory mock data, which is lost on exit. Each test creates its own uniquely named user.
- **OTP:** mock mode accepts the fixed OTP `123456` and the API runs with `MAIL_TRANSPORT=disabled` (only accepted when `NODE_ENV=test`), so no email is sent.
- **Scenarios:** registration and login (incl. wrong OTP, duplicate and unknown users), adding and viewing an expense, validation errors, and per-user data isolation.
- **Diagnostics:** traces, screenshots and video are kept for failures, plus an HTML report and API/Vite logs in the console.

```bash
npx playwright install chromium     # once
npm run test:e2e
npx playwright show-report node_modules/.cache/playwright/report
npx playwright show-trace <path to trace.zip>
```

CI (GitHub Actions): use a job with `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e` with `CI=true`, and upload `node_modules/.cache/playwright/` as an artifact on failure. Agent config under `.github/` is human-edited, so the workflow file is not added automatically.

**Playwright MCP (for AI tools):** `.vscode/mcp.json` (VS Code/Copilot) and `.mcp.json` (Claude Code) register `@playwright/mcp` with an isolated Chromium profile, so agents can explore the running app interactively. It is for development only: it is not repeatable and does not replace the tests above. Point it at a local dev stack (`npm run dev:server`, `npm run dev:client`) with a throwaway database, never production.

## API

`/items` routes require an `Authorization` header with the JWT (raw token or `Bearer <token>`) and only touch the caller's data.

| Route | Purpose |
|-------|---------|
| `GET /server/health` | Health check |
| `POST /users`, `/users/sign-in`, `/users/verify-otp` | Register, request an OTP by email, exchange the OTP for a token (rate limited) |
| `PUT`, `DELETE /users/:id` | Update or delete your own account |
| `GET /items/day/:date`, `/items/week/:startDate`, `/items/month/:startDate` | Expense views |
| `POST /items`, `PUT`, `DELETE /items/:id` | Manage expenses |
