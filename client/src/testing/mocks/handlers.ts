import { http, HttpResponse } from "msw";
import { env } from "@/config/env";

export const testUser = {
  fullName: "Test User",
  phoneNumber: "9000000000",
  email: "test@example.com",
  token: "test-token",
};

const url = (path: string) => `${env.apiUrl}${path}`;

export const handlers = [
  http.get(url("/server/health"), () => HttpResponse.json({ status: "ok" })),

  http.post(url("/users/sign-in"), () =>
    HttpResponse.json({ message: "OTP sent" })
  ),
  http.post(url("/users/verify-otp"), () =>
    HttpResponse.json({
      message: "Login successful",
      userDetails: testUser,
    })
  ),
  http.post(url("/users"), () =>
    HttpResponse.json({ message: "User registered" }, { status: 201 })
  ),

  http.get(url("/items/day/:date"), () =>
    HttpResponse.json({ totalAmount: 0, items: [] })
  ),
  http.get(url("/items/week/:startDate"), () =>
    HttpResponse.json({ weekData: [], items: [], totalAmount: 0 })
  ),
  http.get(url("/items/month/:startDate"), () =>
    HttpResponse.json({ monthData: [], items: [], totalAmount: 0 })
  ),
  http.post(url("/items"), async ({ request }) =>
    HttpResponse.json(await request.json(), { status: 201 })
  ),
  http.put(url("/items/:id"), async ({ request }) =>
    HttpResponse.json(await request.json())
  ),
];
