import { expect, loginViaUi, newUser, registerViaApi, test, today } from './support/fixtures';

test('adds an expense and shows it on the dashboard', async ({ page, request }) => {
  const user = newUser('spender');
  await registerViaApi(request, user);
  await loginViaUi(page, user);

  await page.locator('button.rounded-full').click();
  await page.locator('input[name="amount"]').fill('250');
  await page.locator('form div.text-center', { hasText: 'Grocery' }).getByRole('button').click();
  await page.getByPlaceholder('Enter the name who received payment').fill('Corner Store');
  await page.locator('input[name="date"]').fill(today());
  await page.locator('input[name="time"]').fill('18:30');
  const created = page.waitForResponse((r) => r.url().endsWith('/items') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add Expense' }).click();
  expect((await created).status()).toBe(201);

  // The dashboard does not refetch after adding, so reload to read it back from the API.
  await page.reload();
  const row = page.locator('div.mx-4.my-2', { hasText: 'Corner Store' });
  await expect(row).toContainText('Grocery');
  await expect(row).toContainText('₹ 250');
});

test('requires a category before submitting an expense', async ({ page, request }) => {
  const user = newUser('nocat');
  await registerViaApi(request, user);
  await loginViaUi(page, user);

  await page.locator('button.rounded-full').click();
  await page.locator('input[name="amount"]').fill('10');
  await page.locator('input[name="date"]').fill(today());
  await page.locator('input[name="time"]').fill('09:00');
  await page.getByPlaceholder('Enter the name who received payment').fill('Nobody');
  await page.getByRole('button', { name: 'Add Expense' }).click();

  await expect(page.getByText('Please select a category')).toBeVisible();
});
