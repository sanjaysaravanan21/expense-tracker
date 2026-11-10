import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => dialog.dismiss());

  await page.route('**/server/health', (route) => route.fulfill({ json: { status: 'ok' } }));
  await page.route('**/users/sign-in', (route) =>
    route.fulfill({ json: { message: 'OTP sent' } }),
  );
  await page.route('**/users/verify-otp', (route) =>
    route.fulfill({ json: { message: 'Login successful', userDetails: { fullName: 'E2E User' } } }),
  );
  await page.route('**/users', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, json: { message: 'User registered' } });
      return;
    }

    await route.continue();
  });
  await page.route('**/items/**', (route) => {
    const url = route.request().url();
    if (url.includes('/items/day/')) {
      return route.fulfill({ json: { totalAmount: 0, items: [] } });
    }
    if (url.includes('/items/week/')) {
      return route.fulfill({ json: { weekData: [], items: [], totalAmount: 0 } });
    }
    if (url.includes('/items/month/')) {
      return route.fulfill({ json: { monthData: [], items: [], totalAmount: 0 } });
    }

    return route.continue();
  });
});

test('redirects guests to login when they open the dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('heading', { name: 'Login with Phone Number' })).toBeVisible();
});

test('logs in with an OTP and opens the expense dashboard', async ({ page }) => {
  await page.goto('/auth');
  await page.getByPlaceholder('Enter your phone number').fill('9000000000');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByPlaceholder('Enter the OTP').fill('123456');
  await page.getByRole('button', { name: 'Verify OTP' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('E2E!', { exact: true })).toBeVisible();
});

test('registers a user and displays success feedback', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('button', { name: 'Register' }).first().click();
  await page.getByPlaceholder('Enter your full name').fill('E2E User');
  await page.getByPlaceholder('Enter your email').fill(`${randomUUID()}@example.invalid`);
  await page.getByPlaceholder('Enter your phone number').fill('9000000000');
  await page.getByRole('button', { name: 'Register' }).last().click();

  await expect(page.getByRole('heading', { name: 'Registration Successful!' })).toBeVisible();
});
