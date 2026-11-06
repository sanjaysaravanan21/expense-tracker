import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/testing/mocks/server";
import { env } from "@/config/env";
import { api, setUnauthorizedHandler } from "./api-client";

const getDayResponse = (date: string) => api.get(`/items/day/${date}`);

describe("401 handling", () => {
  it("calls the unauthorized handler for expired sessions on data endpoints", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    server.use(
      http.get(`${env.apiUrl}/items/day/:date`, () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
      )
    );

    await expect(getDayResponse("2024-09-18")).rejects.toThrow();

    expect(handler).toHaveBeenCalledTimes(1);
    setUnauthorizedHandler(undefined);
  });

  it("does not log out on a failed sign-in (wrong OTP)", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    server.use(
      http.post(`${env.apiUrl}/users/verify-otp`, () =>
        HttpResponse.json({ message: "Invalid OTP" }, { status: 401 })
      )
    );

    await expect(api.post("/users/verify-otp", {})).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
    setUnauthorizedHandler(undefined);
  });
});

describe("api-client", () => {
  it("sends the stored token as the Authorization header", async () => {
    localStorage.setItem(
      "state",
      JSON.stringify({ userDetails: { token: "abc-token" } })
    );
    let received: string | null = null;
    server.use(
      http.get(`${env.apiUrl}/items/day/:date`, ({ request }) => {
        received = request.headers.get("authorization");
        return HttpResponse.json({ totalAmount: 0, items: [] });
      })
    );

    await getDayResponse("2024-09-18");

    expect(received).toBe("abc-token");
  });

  it("omits Authorization when there is no session", async () => {
    let received: string | null = "unset";
    server.use(
      http.get(`${env.apiUrl}/items/day/:date`, ({ request }) => {
        received = request.headers.get("authorization");
        return HttpResponse.json({ totalAmount: 0, items: [] });
      })
    );

    await api.get("/items/day/2024-09-18");

    expect(received).toBeNull();
  });

  it("survives corrupted session storage", async () => {
    localStorage.setItem("state", "{not json");

    const response = await getDayResponse("2024-09-18");

    expect(response.status).toBe(200);
  });
});
