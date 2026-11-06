import axios, { AxiosError, type AxiosResponse } from "axios";
import { env } from "@/config/env";

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

// The session is persisted by AppContext under the "state" key.
const readToken = (): string | undefined => {
  try {
    const state = JSON.parse(localStorage.getItem("state") || "{}");
    return state.userDetails?.token;
  } catch {
    return undefined;
  }
};

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers["Authorization"] = token;
  }
  return config;
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | undefined;

// The app shell registers how to end the session, keeping this module free of app imports.
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | undefined) => {
  onUnauthorized = handler;
};

// Sign-in/verify/register legitimately return 401/4xx for bad credentials; only expired sessions should log out.
const isAuthEndpoint = (url?: string) => url?.startsWith("/users") ?? false;

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.code === AxiosError.ECONNABORTED) {
      alert(
        "Using Hobby Servers, Please wait for a minute & then use the Application"
      );
    }

    if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url)) {
      onUnauthorized?.();
    }

    if (error.response) {
      console.error("Error response:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("No response received");
    } else {
      console.error("Error setting up the request:", error.message);
    }

    return Promise.reject(error);
  }
);

// Short timeout on purpose: a slow health check means the hobby server is still waking up.
const healthClient = axios.create({ baseURL: env.apiUrl, timeout: 500 });

export const appHealth = () => healthClient.get("/server/health");
