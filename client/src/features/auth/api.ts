import { api } from "@/lib/api-client";

export const signIn = async (phoneNumber: string) => {
  const response = await api.post("/users/sign-in", { phoneNumber });
  return response.data;
};

export const verifyOtp = (otp: string, phoneNumber: string) =>
  api.post("/users/verify-otp", { otp, phoneNumber });

export const registerUser = (
  fullName: string,
  email: string,
  phoneNumber: string
) => api.post("/users", { fullName, email, phoneNumber });
