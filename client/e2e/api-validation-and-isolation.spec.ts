import { API_URL } from './support/env';
import { expect, loginViaApi, loginViaUi, newUser, registerViaApi, test, today } from './support/fixtures';

const expense = (paidTo: string) => ({
  category: 'food',
  amount: 99,
  type: 'expense',
  date: today(),
  time: '12:00',
  paidTo,
});

test.describe('validation errors', () => {
  test('rejects malformed registration and OTP bodies with 400', async ({ request }) => {
    const bad = await request.post(`${API_URL}/users`, {
      data: { fullName: '', phoneNumber: '123', email: 'nope' },
    });
    expect(bad.status()).toBe(400);

    const badOtp = await request.post(`${API_URL}/users/verify-otp`, {
      data: { phoneNumber: '9000000000', otp: 'abc' },
    });
    expect(badOtp.status()).toBe(400);
  });

  test('rejects invalid expenses without leaking internals', async ({ request }) => {
    const user = newUser('validate');
    await registerViaApi(request, user);
    const token = await loginViaApi(request, user);

    const response = await request.post(`${API_URL}/items`, {
      headers: { Authorization: token },
      data: { ...expense('x'), amount: -5, category: 'nonsense' },
    });
    expect(response.status()).toBe(400);
    expect(JSON.stringify(await response.json())).not.toMatch(/stack|mongoose|MongoServerError/i);
  });
});

test.describe('access isolation', () => {
  test('requires authentication for item routes', async ({ request }) => {
    expect((await request.get(`${API_URL}/items/day/${today()}`)).status()).toBe(401);
    expect((await request.post(`${API_URL}/items`, { data: expense('x') })).status()).toBe(401);
  });

  test("never exposes one user's expenses to another", async ({ page, request }) => {
    const owner = newUser('owner');
    const other = newUser('other');
    await registerViaApi(request, owner);
    await registerViaApi(request, other);
    const ownerToken = await loginViaApi(request, owner);

    const created = await request.post(`${API_URL}/items`, {
      headers: { Authorization: ownerToken },
      data: expense('Owner Only Cafe'),
    });
    expect(created.status()).toBe(201);

    await loginViaUi(page, other);
    await expect(page.getByText('Owner Only Cafe')).toHaveCount(0);

    const otherToken = await loginViaApi(request, other);
    const day = await request.get(`${API_URL}/items/day/${today()}`, { headers: { Authorization: otherToken } });
    expect((await day.json()).items).toEqual([]);

    const itemId = (await created.json())._id;
    const edit = await request.put(`${API_URL}/items/${itemId}`, {
      headers: { Authorization: otherToken },
      data: { amount: 1 },
    });
    expect(edit.status()).toBe(404);
    const remove = await request.delete(`${API_URL}/items/${itemId}`, { headers: { Authorization: otherToken } });
    expect(remove.status()).toBe(404);
  });
});
