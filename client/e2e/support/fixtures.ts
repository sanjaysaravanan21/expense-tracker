import { randomInt } from 'node:crypto';
import { expect, test as base, type APIRequestContext, type Page } from '@playwright/test';
import { readOtp } from './db';
import { API_URL } from './env';

export interface TestUser {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export function newUser(label = 'user'): TestUser {
  const phoneNumber = String(randomInt(6_000_000_000, 9_999_999_999));
  return { fullName: `E2E ${label}`, email: `${label}-${phoneNumber}@example.invalid`, phoneNumber };
}

export async function registerViaApi(request: APIRequestContext, user: TestUser): Promise<void> {
  const response = await request.post(`${API_URL}/users`, { data: user });
  expect(response.status()).toBe(201);
}

// Completes the real OTP flow against the API and returns the JWT.
export async function loginViaApi(request: APIRequestContext, user: TestUser): Promise<string> {
  const signIn = await request.post(`${API_URL}/users/sign-in`, { data: { phoneNumber: user.phoneNumber } });
  expect(signIn.status()).toBe(200);
  const otp = await readOtp(user.phoneNumber);
  const verify = await request.post(`${API_URL}/users/verify-otp`, { data: { phoneNumber: user.phoneNumber, otp } });
  expect(verify.status()).toBe(200);
  return (await verify.json()).userDetails.token;
}

export async function loginViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth');
  await page.getByPlaceholder('Enter your phone number').fill(user.phoneNumber);
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByPlaceholder('Enter the OTP').waitFor();
  await page.getByPlaceholder('Enter the OTP').fill(await readOtp(user.phoneNumber));
  await page.getByRole('button', { name: 'Verify OTP' }).click();
  await expect(page).toHaveURL('/');
}

export const today = (): string => new Date().toLocaleDateString('en-CA');

export const test = base.extend({
  // The app uses blocking alert() dialogs for feedback; accept them and keep the text for assertions.
  page: async ({ page }, provide) => {
    page.on('dialog', (dialog) => void dialog.accept());
    await provide(page);
  },
});

export { expect };
