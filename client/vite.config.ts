import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/testing/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
