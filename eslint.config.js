import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const features = ['health', 'users', 'items'];
const featureBoundary = (name) => ({
  group: [`**/features/${name}`, `**/features/${name}/**`, `@/features/${name}`, `@/features/${name}/**`],
  message: 'Features must not import other features; compose them in server/src/app.',
});

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'client/**', 'scripts/data/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['server.ts', 'server/**/*.ts', 'vitest.config.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Architecture: shared server code must not depend on features or app.
  {
    files: ['server/src/{lib,config,utils}/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/features/**', '@/features/**', '**/app/**', '@/app/**'], message: 'Shared code must not import from features or app.' },
        ],
      }],
    },
  },
  // Architecture: a feature must not import another feature or app; routes call services, never models.
  ...features.flatMap((feature) => {
    const base = [
      { group: ['**/app/**', '@/app/**'], message: 'Features must not import from app.' },
      ...features.filter((f) => f !== feature).map((f) => featureBoundary(f)),
    ];
    return [
      { files: [`server/src/features/${feature}/**/*.ts`], rules: { 'no-restricted-imports': ['error', { patterns: base }] } },
      {
        files: [`server/src/features/${feature}/*.routes.ts`],
        rules: {
          'no-restricted-imports': ['error', {
            patterns: [...base, { group: ['./*.model', '**/*.model', 'mongoose'], message: 'Routes call services; only services touch models.' }],
          }],
        },
      },
    ];
  }),
  { files: ['**/*.test.ts'], rules: { 'no-console': 'off' } },
  { files: ['.ai-sdlc/**/*.mjs'], languageOptions: { globals: globals.node } },
);
