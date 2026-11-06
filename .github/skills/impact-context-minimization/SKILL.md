---
name: impact-context-minimization
description: Keep context small by locating exact symbols and reading only the files a change needs. Use during analysis and implementation before opening files.
---

# Impact context minimization

1. Search for the symbol, route, or API path first (`grep`/semantic search); do not open directories wholesale.
2. Read, in order: the target file, its direct imports, its test file, the nearest example of the same pattern.
3. Use line ranges for files over ~200 lines.
4. Stop reading once you can state the change and its test; list unread-but-relevant files as risks instead of opening them.
5. Skip generated and bulky paths: `node_modules/`, `dist/`, lockfiles, `scripts/data/`.
