import { describe, expect, it } from "vitest";
import { registerUser, signIn, verifyOtp } from "./api";
import { testUser } from "@/testing/mocks/handlers";

describe("auth api", () => {
  it("requests an OTP", async () => {
    await expect(signIn("9000000000")).resolves.toEqual({ message: "OTP sent" });
  });

  it("verifies an OTP and returns user details", async () => {
    const response = await verifyOtp("123456", "9000000000");

    expect(response.status).toBe(200);
    expect(response.data.userDetails).toEqual(testUser);
  });

  it("registers a user", async () => {
    const response = await registerUser("Test User", "test@example.com", "9000000000");

    expect(response.status).toBe(201);
  });
});
