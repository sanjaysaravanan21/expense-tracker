import { defineConfig, devices } from '@playwright/test';
import { API_PORT, API_URL, E2E_DB_URL, WEB_PORT, WEB_URL, assertSafeDbUrl } from './e2e/support/env';

assertSafeDbUrl(E2E_DB_URL);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/support/global-setup.ts',
  globalTeardown: './e2e/support/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../node_modules/.cache/playwright/report', open: 'never' }],
    ...(process.env.CI ? ([['github']] as const) : []),
  ],
  outputDir: '../node_modules/.cache/playwright/test-results',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Real API on its own port and database. Mail delivery is disabled (allowed only with NODE_ENV=test).
      command: 'npm --prefix .. run dev:server',
      url: `${API_URL}/server/health`,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        DB_URL: E2E_DB_URL,
        JWT_SECRET: 'e2e-only-secret-not-for-production',
        CORS_ORIGIN: WEB_URL,
        MAIL_TRANSPORT: 'disabled',
      },
    },
    {
      command: `npm --prefix .. run dev:client -- --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: API_URL },
    },
  ],
});
