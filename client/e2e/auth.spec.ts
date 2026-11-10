import { expect, loginViaUi, newUser, registerViaApi, test } from './support/fixtures';

test('redirects guests to login when they open the dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('heading', { name: 'Login with Phone Number' })).toBeVisible();
});

test('registers through the UI, then logs in with an OTP', async ({ page }) => {
  const user = newUser('register');
  await page.goto('/auth');
  await page.getByRole('button', { name: 'Register' }).first().click();
  await page.getByPlaceholder('Enter your full name').fill(user.fullName);
  await page.getByPlaceholder('Enter your email').fill(user.email);
  await page.getByPlaceholder('Enter your phone number').fill(user.phoneNumber);
  await page.getByRole('button', { name: 'Register' }).last().click();
  await expect(page.getByRole('heading', { name: 'Registration Successful!' })).toBeVisible();

  await loginViaUi(page, user);
  await expect(page.getByText('E2E!', { exact: true })).toBeVisible();
});

test('shows an error when registering a phone number twice', async ({ page, request }) => {
  const user = newUser('dup');
  await registerViaApi(request, user);

  await page.goto('/auth');
  await page.getByRole('button', { name: 'Register' }).first().click();
  await page.getByPlaceholder('Enter your full name').fill(user.fullName);
  await page.getByPlaceholder('Enter your email').fill(`other-${user.email}`);
  await page.getByPlaceholder('Enter your phone number').fill(user.phoneNumber);
  await page.getByRole('button', { name: 'Register' }).last().click();
  await expect(page.getByText('Registration failed. Please try again.')).toBeVisible();
});

test('rejects a wrong OTP and stays on the login page', async ({ page, request }) => {
  const user = newUser('badotp');
  await registerViaApi(request, user);

  await page.goto('/auth');
  await page.getByPlaceholder('Enter your phone number').fill(user.phoneNumber);
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByPlaceholder('Enter the OTP').fill('000000');
  await page.getByRole('button', { name: 'Verify OTP' }).click();

  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByPlaceholder('Enter the OTP')).toBeVisible();
});

test('does not send an OTP for an unknown phone number', async ({ page }) => {
  await page.goto('/auth');
  await page.getByPlaceholder('Enter your phone number').fill(newUser('ghost').phoneNumber);
  await page.getByRole('button', { name: 'Get OTP' }).click();

  await expect(page.getByPlaceholder('Enter the OTP')).toHaveCount(0);
});
