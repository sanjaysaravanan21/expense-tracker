---
name: git-operations
description: Perform git work safely - inspect status and diffs, branch, stage, commit, push, and open or update a pull request, plus common recovery tasks.
---

# Git operations

Run safe, read-only commands freely. Run state-changing commands only as described below, and stop to ask when a rule says so.

For story-driven work, follow `.ai-sdlc/pipeline.md`. Only the orchestrator runs state-changing git commands. If this skill and the pipeline differ, follow the stricter rule.

## 1. Inspect first (always)

```bash
git status --short --branch
git diff --stat            # unstaged
git diff --staged --stat   # staged
git log --oneline -10
```

Check the current branch and that the working tree contains only the intended changes. If `.ai-sdlc/state/scope.json` exists, every changed file must be inside it. Run `npm run ai:validate` after staging.

## 2. Branch

- Never commit directly to `main`/`master`/`develop`. If on one, create a branch first.
- Use the repository's lowercase branch convention: `issue-<ticket-or-number>-<short-kebab-case-title>`.
- For a Jira story such as `EXP-123`, use its lowercase key in the branch name. Keep the actual Jira key uppercase in commit and PR references.
- Use only lowercase letters, numbers, and hyphens.

Examples:

```bash
git switch -c issue-exp-123-recurring-expenses
git switch -c issue-42-add-monthly-summary
```

If there is no ticket number, use a concise name such as `issue-improve-monthly-summary`.

## 3. Stage

- Stage explicit paths: `git add path/one path/two`. Avoid `git add .` and `git add -A`.
- Never stage `.env*`, keys, `node_modules/`, build output, `scripts/data/`, or unrelated files. If one appears in status, stop and report it.
- Review with `git diff --staged` before committing.
- For story-driven work, run `npm run ai:validate` on the staged changes before committing.

## 4. Commit

Use Conventional Commits, imperative mood, a subject at most 72 characters, and no trailing period:

```text
<type>(<scope>): <subject>

<body: what and why, wrapped at 100 characters; optional>

Refs: EXP-123
```

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
- Scope: the feature or area, for example `items`, `auth`, `dashboard`, `client`, `server`.
- One logical change per commit. Tests go with the code they cover.
- Add the Jira key when there is one.
- If the environment requires a co-author trailer, append it as the last line of the commit message.

```bash
git commit -m "feat(items): add recurring expense support" -m "Refs: EXP-123"
```

- The Husky pre-commit hook must pass. If it fails, fix the cause, revalidate, and create a new commit. Never use `--no-verify`.
- Do not amend commits unless explicitly requested. Do not amend commits that are already pushed.

## 5. Push

For story-driven work, ask the user to confirm before pushing.

```bash
git push -u origin <branch>       # first push
git push                          # later pushes
```

- Never force-push during the story pipeline.
- Never force-push to a shared branch or to `main`.
- If a push is rejected, inspect the remote changes and ask the user before rebasing or merging. Re-run the checks before pushing again.

## 6. Pull request

Before opening: `npm run check-types`, `npm run lint`, and `npm run test -- --run` pass, and the review stage has no `critical`/`high` findings.

- Preferred: use the SCM integration (GitHub MCP or `gh pr create`) when connected.
- Otherwise, give the user the PR title and body to paste.
- Base branch: `main` unless told otherwise. Open as draft if checks are incomplete.
- Title: use the Conventional Commit format, such as `feat(items): add recurring expense support`.
- Before creating a PR or handing off PR text, read `.github/PULL_REQUEST_TEMPLATE.md` and use it as the single source of truth for the PR body. Do not maintain tool-specific copies.
- Fill in the template with a one-line description, relevant implementation or fix evidence, actual test coverage and results, acceptance criteria, risk notes, and the linked story.
- Include screenshots for visible changes. For bug fixes, include before-and-after screenshots when practical. Use synthetic data; do not fabricate evidence. If screenshots or a test layer do not apply or are unavailable, mark them N/A and explain why.
- Record actual commands and outcomes in the test coverage section. Do not claim tests passed without command output.
- For a Jira story, include its key, for example `EXP-123`, and, when safe to share, its URL. GitHub issue-closing keywords do not close Jira stories.
- For a GitHub issue, use `Closes #123` only if the user wants it closed on merge; otherwise use `Refs #123`.

## 7. General operations

For story-driven work, the pipeline forbids force-pushing and deleting branches. Ask for confirmation before any destructive operation or history rewrite.

| Task | Command | Rule |
|---|---|---|
| Update from main | `git fetch origin && git rebase origin/main` | Ask first; do not rewrite shared history |
| Undo unstaged edit | `git restore <path>` | Confirm first; it discards work |
| Unstage | `git restore --staged <path>` | Verify the intended path first |
| Fix last commit message | `git commit --amend` | Only if explicitly requested and not pushed |
| Revert a pushed commit | `git revert <sha>` | Confirm first; preferred over reset |
| Park work | `git stash push -m "<msg>"`, then `git stash pop` | Ask first and name stashes |
| Resolve conflicts | edit files, `git add <path>`, `git rebase --continue` | Keep both sides' intent; re-run checks |
| Delete merged branch | `git branch -d <branch>` | Not allowed during the story pipeline; otherwise confirm first |

## Never, without explicit user confirmation

`git reset --hard`, `git clean -fd`, `git push --force`, `git rebase` on pushed shared branches, `git checkout .`, deleting remote branches, rewriting history, or changing git config.

Never use `--no-verify` or change hooks to get past a failure. Report the failure instead.

## Report

After finishing, report: Jira key when applicable, branch, commit SHAs with subjects, push result, PR link or PR text, and the checks run with their results.