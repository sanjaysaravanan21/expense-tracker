import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../hooks/guard.mjs';
import { sanitize } from './sanitize-input.mjs';
import { validate, parseAddedLines } from './pre-commit-validator.mjs';

const config = loadConfig();

test('sanitize redacts email, phone, internal IP and DB URI', () => {
  const { text, redactions } = sanitize(
    'User jane@acme.com (9876543210) reports 192.168.1.20 failing; db mongodb+srv://u:p@cluster.mongodb.net/x',
    config,
  );
  assert.ok(!/jane@acme|9876543210|192\.168|mongodb\+srv/.test(text), text);
  assert.deepEqual(Object.keys(redactions).sort(), ['email', 'ipv4', 'mongodb-uri', 'phone']);
});

test('validator flags sensitive files, scope violations and secrets', () => {
  const scope = { story: 'S1', allowed: ['server/src/features/items/'] };
  const problems = validate({
    config,
    scope,
    files: ['server/src/features/items/a.ts', 'server/src/lib/b.ts', '.env'],
    addedLines: [
      { file: 'a.ts', line: 3, text: 'const jwtSecret = "abcdefghijklmnop1234";' },
      { file: 'a.ts', line: 4, text: 'const ok = process.env.JWT_SECRET;' },
      { file: 'a.ts', line: 5, text: 'const t = "abcdefghijklmnop1234"; // ai-sdlc-allow-secret' },
    ],
  });
  assert.equal(problems.length, 4, problems.join('\n'));
  assert.ok(problems.some((p) => p.includes('Sensitive file staged: .env')));
  assert.ok(problems.some((p) => p.includes('server/src/lib/b.ts')));
  assert.ok(problems.some((p) => p.includes('hardcoded-secret-assignment') && p.includes('a.ts:3')));
});

test('validator passes a clean change with no active scope', () => {
  assert.deepEqual(validate({ config, scope: null, files: ['client/src/a.ts'], addedLines: [{ file: 'client/src/a.ts', line: 1, text: 'export const a = 1;' }] }), []);
});

test('parseAddedLines tracks file and line numbers', () => {
  const diff = '+++ b/x.ts\n@@ -1,0 +5,2 @@\n+one\n+two\n';
  assert.deepEqual(parseAddedLines(diff), [{ file: 'x.ts', line: 5, text: 'one' }, { file: 'x.ts', line: 6, text: 'two' }]);
});
