#!/usr/bin/env node
// Strips PII, internal IPs and DB URIs from a ticket before it reaches an AI model.
// Usage: node .ai-sdlc/guardrails/sanitize-input.mjs < ticket.txt > ticket.clean.txt
//        node .ai-sdlc/guardrails/sanitize-input.mjs ticket.txt
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadConfig } from '../hooks/guard.mjs';

export function sanitize(text, config = loadConfig()) {
  const redactions = {};
  let out = text;
  for (const { name, pattern, replacement } of config.piiPatterns) {
    out = out.replace(new RegExp(pattern, 'gi'), () => {
      redactions[name] = (redactions[name] ?? 0) + 1;
      return replacement;
    });
  }
  return { text: out, redactions };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : readFileSync(0, 'utf8');
  const { text, redactions } = sanitize(source);
  process.stdout.write(text);
  const summary = Object.entries(redactions).map(([k, v]) => `${k}=${v}`).join(' ');
  if (summary) process.stderr.write(`\nRedacted: ${summary}\n`);
}
