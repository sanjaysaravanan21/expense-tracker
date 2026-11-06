---
name: git-operations
description: Perform git work safely - inspect status and diffs, branch, stage, commit, push, and open or update a pull request, plus common recovery tasks. Use whenever code must be committed, pushed, or turned into a PR, or when a git state question comes up.
---

# Git operations

Run the safe, read-only commands freely. Run the state-changing commands only as described below, and stop to ask when a rule says so.

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
- Name: `<type>/<ticket-or-slug>`, for example `feat/EXP-123-recurring-expenses`, `fix/EXP-88-login-redirect`. Types match commit types below. Lowercase, hyphens, no spaces.

```bash
git switch -c feat/EXP-123-short-slug
```

## 3. Stage

- Stage explicit paths: `git add path/one path/two`. Avoid `git add .` and `git add -A`.
- Never stage `.env*`, keys, `node_modules/`, build output, `scripts/data/`, or unrelated files. If one appears in status, stop and report it.
- Review with `git diff --staged` before committing.

## 4. Commit

Conventional Commits, imperative mood, subject at most 72 characters, no trailing period:

```
<type>(<scope>): <subject>

<body: what and why, wrapped at 100 chars; optional>

Refs: EXP-123
```

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.
- Scope: the feature or area, for example `items`, `auth`, `dashboard`, `client`, `server`.
- One logical change per commit. Tests go with the code they cover.
- Add the ticket reference when there is one.
- If the environment requires a co-author trailer, append it as the last line of the body.

```bash
git commit -m "feat(items): add recurring expense support" -m "Refs: EXP-123"
```

- The husky pre-commit hook must pass. If it fails, fix the cause and create a new commit. Never use `--no-verify`.
- Do not use `--amend` on commits that are already pushed.

## 5. Push

```bash
git push -u origin <branch>       # first push
git push                          # later pushes
```

- Never force-push to a shared branch or to `main`. On your own unreviewed feature branch, use only `git push --force-with-lease`, and only after the user confirms.
- If the push is rejected, run `git fetch` and `git rebase origin/<branch>` (or merge, following repo preference), re-run the checks, then push. Do not force.

## 6. Pull request

Before opening: `npm run check-types`, `npm run lint` and `npm run test -- --run` pass, and the review stage has no `critical`/`high` findings.

- Preferred: use the SCM integration (GitHub MCP or `gh pr create`) when connected.
- Otherwise: push the branch and give the user the PR title and body to paste.
- Base branch: `main` unless told otherwise. Open as draft if checks are incomplete.
- Title: same format as a commit subject.
- Body template:

```markdown
## Summary
What changed and why (link the ticket).

## Changes
- file or area: one line each

## Acceptance criteria
| AC | Evidence (test/file/command) | Result |
|----|------------------------------|--------|

## Testing
Commands run with pass/fail.

## Risks / notes
```

- Do not merge, approve, or close PRs yourself. Never put secrets, internal URLs, or PII in titles or bodies.

## 7. General operations

| Task | Command | Rule |
|---|---|---|
| Update from main | `git fetch origin && git rebase origin/main` | Only on unpushed or personal branches; otherwise merge |
| Undo unstaged edit | `git restore <path>` | Confirm first, it discards work |
| Unstage | `git restore --staged <path>` | Safe |
| Fix last commit message | `git commit --amend` | Only if not pushed |
| Revert a pushed commit | `git revert <sha>` | Preferred over reset |
| Park work | `git stash push -m "<msg>"`, then `git stash pop` | Name stashes |
| Resolve conflicts | edit files, `git add <path>`, `git rebase --continue` | Keep both sides' intent; re-run tests |
| Inspect history | `git log --oneline --graph -20`, `git show <sha>`, `git blame <path>` | Read-only |
| Delete merged branch | `git branch -d <branch>` | Only after merge; use `-d`, not `-D` |

## Never, without explicit user confirmation

`git reset --hard`, `git clean -fd`, `git push --force`, `git rebase` on pushed shared branches, `git checkout .`, deleting remote branches, rewriting history, changing git config, or running with `--no-verify`.

## Report

After finishing, report: branch, commit SHAs with subjects, push result, PR link (or the PR text), and the checks run.