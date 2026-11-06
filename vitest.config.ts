import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['server/src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['server/src/testing/setup.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./server/src', import.meta.url)) },
  },
});
