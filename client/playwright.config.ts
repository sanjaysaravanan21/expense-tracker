import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../node_modules/.cache/playwright/report', open: 'never' }],
  ],
  outputDir: '../node_modules/.cache/playwright/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm --prefix .. run dev:client -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    env: { VITE_API_URL: 'http://127.0.0.1:4500' },
  },
});
