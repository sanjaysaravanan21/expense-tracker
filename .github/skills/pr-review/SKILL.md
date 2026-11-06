---
name: pr-review
description: Review a local change set against its spec using a severity scale and an acceptance-criteria traceability table. Use in the Review stage before a PR.
---

# PR review

Severity:
- `critical`: security flaw, data loss, broken auth, crash on the main path.
- `high`: acceptance criterion unmet, regression, architectural-rule violation, unrelated logic removed, missing validation on new input.
- `medium`: missing edge-case handling or tests, unclear error handling.
- `low`: naming, small readability issues.

Procedure: read the diff, map each hunk to an AC or flag it as unrelated; check `AGENTS.md` rules; confirm tests assert user-visible behavior; verify each reported command actually ran.

Report only issues you can point to in the diff with a file and reason. No style nitpicks that lint already enforces.

Traceability table:

| AC | Evidence (test/file/command) | Result |
|----|------------------------------|--------|
